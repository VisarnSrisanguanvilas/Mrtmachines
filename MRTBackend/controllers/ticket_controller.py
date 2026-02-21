from collections import deque
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlmodel import Session, select
from datetime import date, datetime, timedelta
from configs.db import get_session
from models.cash_inventory_model import CashInventory
from models.machine_model import Machine
from models.ticket_model import Ticket, StatusEnum
from schemas.ticket_schema import TicketAdjustRequest, TicketUseRequest
from utils.token import decode_token

router = APIRouter(prefix="/ticket", tags=["tickets"])

@router.post("/check-in")
def check_in(
    body: TicketUseRequest,
    session: Session = Depends(get_session)
):
    # 1. หาตั๋ว
    ticket = session.get(Ticket, body.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # 2. เช็คสถานะ: ต้องเป็น unused เท่านั้น
    if ticket.status == StatusEnum.in_system:
        raise HTTPException(status_code=400, detail="Ticket already checked in (Duplicate entry)")
    if ticket.status == StatusEnum.used:
        raise HTTPException(status_code=400, detail="Ticket already used")

    # 3. เช็คความถูกต้อง (Location & Time)
    # 3.1 เช็คสถานีต้นทาง
    if ticket.from_station_id != body.station_id:
        raise HTTPException(status_code=400, detail="Invalid Entry Station (Wrong station)")
    
    # 3.2 เช็ควันที่ (FIXED: ต้องเทียบกับวันนี้ ไม่ใช่ class date)
    # สมมติว่าตั๋วต้องใช้ภายในวันที่ออกเท่านั้น
    if ticket.issued_at.date() != datetime.utcnow().date(): 
        raise HTTPException(status_code=400, detail="Ticket expired (Date mismatch)")

    # 4. อัปเดตสถานะเป็น 'in_system'
    ticket.status = StatusEnum.in_system
    ticket.check_in_at = datetime.utcnow()
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)

    return {
        "message": "Gate Open (Entry)", 
        "status": ticket.status,
        "entry_at": ticket.check_in_at
    }

def build_graph():
    graph = {}
    def connect(a, b):
        graph.setdefault(a, []).append(b)
        graph.setdefault(b, []).append(a)
    for i in range(1, 32):
        connect(i, i + 1)
    connect(32, 1)
    for i in range(33, 38):
        connect(i, i + 1)
    connect(1, 33)
    for i in range(39, 53):
        connect(i, i + 1)
    connect(53, 10)
    return graph

STATION_GRAPH = build_graph()

def get_shortest_hop(start, end):
    if start == end:
        return 0
    queue = deque([(start, 0)])
    visited = {start}
    while queue:
        node, distance = queue.popleft()
        if node == end:
            return distance
        for neighbor in STATION_GRAPH[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, distance + 1))

    return -1

def get_fare_logic(start, end):
    if not (1 <= start <= 54 and 1 <= end <= 54):
        return -2
    
    start = 10 if start == 54 else start
    end = 10 if end == 54 else end
    hops = get_shortest_hop(start, end)
    if hops < 0:
        return -1
    
    base = 17
    max_price = 45
    if hops == 0:
        return base
    
    extra = 0
    for i in range(hops - 1):
        extra += 3 if i % 2 == 0 else 2
    return min(base + extra, max_price)

@router.post("/check-out")
def check_out(
    body: TicketUseRequest,
    session: Session = Depends(get_session)
):
    # 1. หาตั๋ว
    ticket = session.get(Ticket, body.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # 2. เช็คสถานะ: ต้องเป็น in_system เท่านั้น
    if ticket.status == StatusEnum.unused:
        raise HTTPException(status_code=400, detail="Ticket not checked in yet")
    if ticket.status == StatusEnum.used:
        raise HTTPException(status_code=400, detail="Ticket already used")

    # 3. เช็คความถูกต้อง (Location & Price Logic)
    actual_fare = get_fare_logic(ticket.from_station_id, body.station_id)

    if actual_fare < 0:
        raise HTTPException(status_code=400, detail="Invalid Route or Station ID")

    if actual_fare > ticket.price:
        diff = actual_fare - ticket.price
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient fare. Please add value {diff} THB"
        )

    # 3.3 เช็คเวลา (Time Limits)
    if datetime.utcnow() > ticket.issued_at + timedelta(hours=24):
          raise HTTPException(status_code=400, detail="Ticket expired (Invalid Date)")

    if ticket.check_in_at and (datetime.utcnow() > ticket.check_in_at + timedelta(hours=2)):
        raise HTTPException(status_code=400, detail="Time limit exceeded (Overtime in system)")

    # ---------------------------------------------------------
    # 4. 🔥 (NEW) คืนเหรียญให้ Machine ที่สถานีปลายทาง
    # ---------------------------------------------------------
    
    # ค้นหาตู้ที่อยู่ที่สถานีปลายทาง (station_id ที่ส่งเข้ามา)
    statement = select(Machine).where(Machine.station_id == body.station_id)
    exit_machine = session.exec(statement).first()

    # ถ้าเจอเครื่อง -> คืนเหรียญเข้าสต็อก
    machine_updated_id = None
    if exit_machine:
        exit_machine.ticket_stock += 1
        session.add(exit_machine)
        machine_updated_id = exit_machine.id
    
    # (Optional) ถ้าไม่เจอเครื่อง อาจจะ Log Warning ไว้ แต่ไม่ควร Block การออก
    # else:
    #    print(f"Warning: No machine found at station {body.station_id} to return ticket.")

    # ---------------------------------------------------------

    # 5. อัปเดตสถานะตั๋วเป็น 'used' (จบการเดินทาง)
    ticket.status = StatusEnum.used
    ticket.check_out_at = datetime.utcnow()

    session.add(ticket)
    
    # Commit ทีเดียวทั้ง Ticket และ Machine
    session.commit()
    session.refresh(ticket)

    return {
        "message": "Gate Open (Exit)", 
        "status": ticket.status,
        "finished_at": ticket.check_out_at,
        "exit_station": body.station_id,
        "cost_deducted": actual_fare,
        "returned_to_machine_id": machine_updated_id, # บอกด้วยว่าคืนเข้าตู้ไหน
        "stock_updated": True if exit_machine else False
    }
     
@router.post("/adjust-ticket")
def adjust_ticket(
    body: TicketAdjustRequest,
    request: Request,
    session: Session = Depends(get_session)
):
    token = request.headers.get("authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    user = decode_token(token)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # 1. หาตั๋ว
    ticket = session.get(Ticket, body.ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # 2. เช็คสถานะ: ต้องอยู่ในระบบ (in_system) ถึงจะปรับได้
    if ticket.status != StatusEnum.in_system:
        raise HTTPException(status_code=400, detail="Ticket must be in_system to adjust")

    # 3. คำนวณราคาใหม่ (จากต้นทางเดิม -> ปลายทางใหม่)
    new_fare = get_fare_logic(ticket.from_station_id, body.new_station_id)
    
    if new_fare < 0:
        raise HTTPException(status_code=400, detail="Invalid Station Logic")

    # 4. คำนวณส่วนต่างที่ต้องเก็บเพิ่ม
    # ถ้า new_fare น้อยกว่าหรือเท่าเดิม (เช่นเปลี่ยนมาลงสถานีใกล้ขึ้น) ก็ไม่ต้องเก็บเพิ่ม (diff = 0)
    additional_cost = max(0, new_fare - ticket.price)

    # 5. อัปเดตตั๋วเลย (สมมติว่า Admin รับเงินสดหน้างานแล้ว)
    # เราต้องแก้ราคาในตั๋ว (price) ให้เท่ากับ new_fare เพื่อให้ตอนไปแตะออกผ่านเงื่อนไข actual_fare <= ticket.price
    if new_fare > ticket.price:
        ticket.price = new_fare
    
    ticket.to_station_id = body.new_station_id
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)

    return {
        "message": "Ticket adjusted successfully",
        "ticket_id": ticket.id,
        "new_station_id": ticket.to_station_id,
        "new_ticket_value": ticket.price,
        "amount_to_pay": additional_cost  # Admin ดูยอดตรงนี้แล้วเก็บเงินลูกค้า
    }