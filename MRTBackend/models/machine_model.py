# models/machine_model.py
from typing import Optional, List, TYPE_CHECKING 
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .cash_inventory_model import CashInventory
    from .transaction_model import MachineTransaction
    from .station_model import Station

class Machine(SQLModel, table=True):
    __tablename__ = "machines"

    id: Optional[int] = Field(default=None, primary_key=True)

    cash_in_balance: int = 0     
    cash_float_balance: int = 0 
    ticket_stock: int = 0
    is_active: bool = True
    station_id: int = Field(foreign_key="stations.id")
    

    cash_items: List["CashInventory"] = Relationship(back_populates="machine") 
    transactions: List["MachineTransaction"] = Relationship(back_populates="machine")
    station: Optional["Station"] = Relationship()