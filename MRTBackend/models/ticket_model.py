# models/ticket_model.py
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

class StatusEnum (str, Enum):
    unused = "unused"
    used = "USED"
    in_system = "in_system"
    

if TYPE_CHECKING:
    from .transaction_model import MachineTransaction
    from .station_model import Station

class Ticket(SQLModel, table=True):
    __tablename__ = "tickets"

    id: Optional[int] = Field(default=None, primary_key=True)
    transaction_id: int = Field(foreign_key="transactions.id")
    status: StatusEnum = Field(default=StatusEnum.unused)
    
    from_station_id: int = Field(foreign_key="stations.id")
    to_station_id: int = Field(foreign_key="stations.id")

    price: int
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    check_in_at: Optional[datetime] = None   # 🔥 เข้า
    check_out_at: Optional[datetime] = None 

    transaction: Optional["MachineTransaction"] = Relationship(back_populates="ticket")

    from_station: Optional["Station"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Ticket.from_station_id]"}
    )
    to_station: Optional["Station"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Ticket.to_station_id]"}
    )