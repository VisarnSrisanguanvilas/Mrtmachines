from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum


class StationLine(str, Enum):
    blue = "blue"
    purple = "purple"


class Station(SQLModel, table=True):
    __tablename__ = "stations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    name: str = Field(index=True)
    name_en: str = Field(index=True) 
    line: StationLine 
    x: int
    y: int
    connect_to: Optional[str] = Field(default=None)
    