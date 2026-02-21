
from sqlmodel import Session, select, delete
from configs.db import engine
from models.station_model import Station
from models.machine_model import Machine
from models.cash_inventory_model import CashInventory
from models.ticket_model import Ticket
from models.transaction_model import MachineTransaction

def seed_machines():
    print("Starting Machine Seeding...")
    
    with Session(engine) as session:
        session.exec(delete(Ticket))
        session.exec(delete(MachineTransaction)) 
        session.exec(delete(CashInventory)) 
        session.exec(delete(Machine))      
        session.commit()
        print(" Old machines cleared.")

        stations = session.exec(select(Station)).all()
        
        if not stations:
            print(" No stations found! Please run seed_stations.py first.")
            return

        print(f" Found {len(stations)} stations. Creating machines...")

        machines_created = 0

        for station in stations:
            new_machine = Machine(
                station_id=station.id,
                ticket_stock=100,     
                cash_in_balance=0,
                cash_float_balance=3000,
                is_active=True
            )
            session.add(new_machine)
            session.commit()
            session.refresh(new_machine)

            initial_cash = [
                CashInventory(machine_id=new_machine.id, denomination=1, quantity=100),
                CashInventory(machine_id=new_machine.id, denomination=5, quantity=100),
                CashInventory(machine_id=new_machine.id, denomination=10, quantity=240)
            ]
            
            real_float = sum([c.denomination * c.quantity for c in initial_cash])
            new_machine.cash_float_balance = real_float
            
            session.add(new_machine) 
            for item in initial_cash:
                session.add(item)
            
            machines_created += 1

        session.commit()
        print(f" Successfully created {machines_created} machines (One per station).")

if __name__ == "__main__":
    seed_machines()