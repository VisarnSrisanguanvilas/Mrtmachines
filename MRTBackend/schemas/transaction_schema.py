from typing import Dict, Literal
from sqlmodel import SQLModel


class FareRequest(SQLModel):
    from_station_id: int
    to_station_id: int
 
class PurchaseTicket(SQLModel):
    from_station_id: int
    to_station_id: int
    paid: int
    inserted_items: Dict[int, int] = {}