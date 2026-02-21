# cash_inventory_model.py
from typing import Literal, Optional
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint # เพิ่ม UniqueConstraint


class CashInventory(SQLModel, table=True):
    __tablename__ = "cash_inventory"
    __table_args__ = (
        UniqueConstraint("machine_id", "denomination", name="unique_machine_denomination"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    machine_id: int = Field(foreign_key="machines.id")
    
    denomination: int
    quantity: int  
    
    machine: Optional["Machine"] = Relationship(back_populates="cash_items") # type: ignore