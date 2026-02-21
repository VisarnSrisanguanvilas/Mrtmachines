from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select
from configs.db import get_session
from models.machine_model import Machine
from models.cash_inventory_model import CashInventory
from utils.token import decode_token

from schemas.machine_schema import (
    RestockTicket,
    AddCash,
)

router = APIRouter(prefix="/machines", tags=["machines"])

@router.get("/")
def get_all_machines(request: Request,session: Session = Depends(get_session)):
    token = request.headers.get("authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    user = decode_token(token)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    machines = session.exec(select(Machine)).all()
    return machines

@router.post("/{machine_id}/restock")
def restock_ticket(
    machine_id: int,
    body: RestockTicket,
    request: Request,
    session: Session = Depends(get_session)
):
    token = request.headers.get("authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    user = decode_token(token)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    machine = session.get(Machine, machine_id)

    if not machine:
        raise HTTPException(404, "Machine not found")

    if body.amount <= 0:
        raise HTTPException(400, "Amount must be > 0")

    machine.ticket_stock += body.amount

    session.commit()
    session.refresh(machine)

    return {
        "message": "Ticket restocked",
        "ticket_stock": machine.ticket_stock
    }

@router.post("/{machine_id}/cash")
def add_cash(machine_id: int, body: AddCash, request: Request, session: Session = Depends(get_session)):
    token = request.headers.get("authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    user = decode_token(token)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    machine = session.get(Machine, machine_id)
    if not machine:
        raise HTTPException(404, "Machine not found")

    # ⭐ หา record ก่อนเสมอ
    stmt = select(CashInventory).where(
        CashInventory.machine_id == machine_id,
        CashInventory.denomination == body.denomination
    )

    cash = session.exec(stmt).first()

    if cash is not None:
        # ✅ update
        cash.quantity += body.quantity
    else:
        # ✅ insert
        session.add(
            CashInventory(
                machine_id=machine_id,
                denomination=body.denomination,
                quantity=body.quantity
            )
        )

    machine.cash_float_balance += body.denomination * body.quantity

    session.commit()

    return {"message": "cash added"}

@router.get("/{machine_id}/status")
def get_machine_status(machine_id: int,request: Request, session: Session = Depends(get_session)):
    token = request.headers.get("authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    user = decode_token(token)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    machine = session.get(Machine, machine_id)
    if not machine:
        raise HTTPException(404, "Machine not found")
        
    # ดึงรายการเหรียญ/แบงก์ที่มีในตู้
    cash_inventory = session.exec(
        select(CashInventory).where(CashInventory.machine_id == machine_id)
    ).all()
    
    return {
        "machine_id": machine.id,
        "ticket_stock": machine.ticket_stock,
        "cash_balance": machine.cash_float_balance,
        "cash_inventory": cash_inventory
    }
