from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from configs.db import get_session
from models.cash_inventory_model import CashInventory
from models.machine_model import Machine
from models.ticket_model import StatusEnum, Ticket
from models.transaction_model import MachineTransaction
from schemas.transaction_schema import FareRequest, PurchaseTicket
from typing import Dict, Optional
from collections import deque

router = APIRouter(prefix="/transaction", tags=["transactions"])

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
    print("graph",graph)
    return graph

STATION_GRAPH = build_graph()

def get_shortest_hop(start, end):
    if start == end:
        return 0
    queue = deque([(start, 0)])
    print('queue :', queue)
    visited = {start}
    print('visited :', visited)
    
    while queue:
        
        node, distance = queue.popleft()
        print('node :', node)
        print('distance', distance)
        print('-----------------------')
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

def calculate_change(amount, cash_items):
    inventory = {c.denomination: c.quantity for c in cash_items}
    result = {}

    for coin in sorted(inventory.keys(), reverse=True):
        if amount <= 0:
            break

        use = min(amount // coin, inventory[coin])
        if use:
            result[coin] = use
            amount -= coin * use

    return result if amount == 0 else None

@router.post("/fare")
def calculate_fare(body: FareRequest):
    fare = get_fare_logic(body.from_station_id, body.to_station_id)
    
    if fare == -2:
        raise HTTPException(status_code=404, detail="Station ID not found")
    if fare == -1:
        raise HTTPException(status_code=400, detail="Stations are not connected")

    return {
        "from_station_id": body.from_station_id,
        "to_station_id": body.to_station_id,
        "fare": fare
    }

@router.post("/purchase") 
def purchase_ticket(
    body: PurchaseTicket,
    session: Session = Depends(get_session)
):
    statement = select(Machine).where(Machine.station_id == body.from_station_id)
    machine = session.exec(statement).first()

    if not machine:
        raise HTTPException(404, f"No machine found at station ID {body.from_station_id}")
    
    if not machine.is_active:
        raise HTTPException(400, "Machine at this station is out of service")
    
    if machine.ticket_stock <= 0:
        raise HTTPException(400, "Ticket out of stock")

    total_coin_value = 0  
    total_bill_value = 0  

    for denom, qty in body.inserted_items.items():
        denom_int = int(denom)
        total_value = denom_int * qty 

        if denom_int in [1, 5, 10]:
            total_coin_value += total_value

            target_coin = next((item for item in machine.cash_items if item.denomination == denom_int), None)
            if target_coin:
                target_coin.quantity += qty
        
        else:
            total_bill_value += total_value

    fare = get_fare_logic(body.from_station_id, body.to_station_id)

    if fare == -2: raise HTTPException(404, "Station ID not found")
    if fare == -1: raise HTTPException(400, "Stations are not connected")

    if body.paid < fare:
        raise HTTPException(400, f"Not enough money. Fare is {fare}")

    change = body.paid - fare
    
    change_map = calculate_change(change, machine.cash_items)
    
    if change_map is None:
        raise HTTPException(400, "Machine cannot make exact change (Insufficient coins)")

    for denom, qty in change_map.items():
        for item in machine.cash_items:
            if item.denomination == denom:
                item.quantity -= qty
                break 

    machine.ticket_stock -= 1
    
    machine.cash_in_balance += total_bill_value

    machine.cash_float_balance = machine.cash_float_balance + total_coin_value - change

    tx = MachineTransaction(
        machine_id=machine.id,
        from_station_id=body.from_station_id,
        to_station_id=body.to_station_id,
        fare=fare,
        paid=body.paid,
        change=change
    )
    session.add(tx)
    session.flush()

    ticket = Ticket(
        transaction_id=tx.id,
        from_station_id=body.from_station_id,
        to_station_id=body.to_station_id,
        price=fare,
        status=StatusEnum.unused
    )
    session.add(ticket)
    
    session.add(machine)
    session.commit()
    session.refresh(tx)
    session.refresh(ticket)

    return {
        "message": "Purchase successful",
        "transaction_id": tx.id,
        "ticket_id": ticket.id,
        "machine_id": machine.id,
        "fare": fare,
        "paid": body.paid,
        "change": change,
        "change_breakdown": change_map,
        "ticket_left": machine.ticket_stock
    }