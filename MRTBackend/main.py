from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from configs.db import lifespan
from controllers.station_controller import router as station_router
from controllers.machine_controller import router as machine_router
from controllers.transaction_controller import router as transaction_router
from controllers.ticket_controller import router as ticket_router
from controllers.admin_controller import router as admin_router

app = FastAPI(title="Last Game (SQLModel ORM + SQLite)", lifespan=lifespan)

app.include_router(station_router)
app.include_router(machine_router)
app.include_router(transaction_router)
app.include_router(ticket_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return{"ping":"pong"}
