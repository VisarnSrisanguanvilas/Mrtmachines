# schemas/ticket_schema.py
from pydantic import BaseModel

class TicketUseRequest(BaseModel):
    ticket_id: int
    station_id: int # ID ของสถานีที่ประตู (Gate) ตั้งอยู่
    
class TicketAdjustRequest(BaseModel):
    ticket_id: int
    new_station_id: int