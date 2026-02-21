from typing import Literal
from sqlmodel import SQLModel


class RestockTicket(SQLModel):
    amount: int

DenominationType = Literal[1, 5, 10]

class AddCash(SQLModel):
    denomination: DenominationType
    quantity: int

