from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class Admin(SQLModel, table=True):
    __tablename__ = "admin"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password: str
    role: str = Field(default="user")
