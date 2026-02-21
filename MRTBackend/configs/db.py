from fastapi import FastAPI
from contextlib import  asynccontextmanager
from sqlmodel import(SQLModel, create_engine, Session,)

engine = create_engine(
    "sqlite:///./app.db",
    connect_args={"check_same_thread": False},
)

def get_session():
    with Session(engine) as session:
        yield session

@asynccontextmanager 
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield
