from typing import Optional
from sqlmodel import SQLModel

class StationRead(SQLModel):
    id: int
    code: str
    name: str
    name_en: str 
    line: str
    x: int
    y: int
    connect_to: Optional[str] = None
    
