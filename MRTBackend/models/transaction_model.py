# models/transaction_model.py
from datetime import datetime
from typing import Optional, TYPE_CHECKING # เพิ่ม TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .machine_model import Machine
    from .station_model import Station
    from .ticket_model import Ticket

class MachineTransaction(SQLModel, table=True):
    __tablename__ = "transactions"

    id: Optional[int] = Field(default=None, primary_key=True)

    machine_id: int = Field(foreign_key="machines.id")
    from_station_id: int = Field(foreign_key="stations.id")
    to_station_id: int = Field(foreign_key="stations.id")

    fare: int
    paid: int
    change: int
    
    # ควรเพิ่ม created_at เสมอสำหรับ Transaction
    created_at: datetime = Field(default_factory=datetime.utcnow)

    machine: Optional["Machine"] = Relationship(back_populates="transactions")

    # จุดสำคัญ: ต้องแก้ [Transaction.id] เป็น [MachineTransaction.id] ให้ตรงชื่อ Class
    from_station: Optional["Station"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[MachineTransaction.from_station_id]"}
    )

    to_station: Optional["Station"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[MachineTransaction.to_station_id]"}
    )
    
    ticket: Optional["Ticket"] = Relationship(back_populates="transaction")