from datetime import datetime, time
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlmodel import Session, select
from configs.db import get_session
from models.station_model import Station
from schemas.station_schema import StationRead
router = APIRouter(prefix="/station", tags=["stations"])


@router.get("/", response_model=list[StationRead])
def get_stations(session: Session = Depends(get_session)):
    return session.exec(select(Station)).all()





