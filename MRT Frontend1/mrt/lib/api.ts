const BASE = "http://localhost:8000";

export const API = {
  // Stations
  getStations: () => fetch(`${BASE}/station/`).then(r => r.json()),

  // Fare
  calculateFare: (from: number, to: number) =>
    fetch(`${BASE}/transaction/fare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_station_id: from, to_station_id: to }),
    }).then(r => r.json()),

  // Purchase
  purchaseTicket: (from: number, to: number, paid: number, inserted_items: Record<string, number>) =>
    fetch(`${BASE}/transaction/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_station_id: from, to_station_id: to, paid, inserted_items }),
    }).then(r => r.json()),

  // Check-in
  checkIn: (ticket_id: number, station_id: number) =>
    fetch(`${BASE}/ticket/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id, station_id }),
    }).then(r => r.json()),

  // Check-out
  checkOut: (ticket_id: number, station_id: number) =>
    fetch(`${BASE}/ticket/check-out`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id, station_id }),
    }).then(r => r.json()),

  // Admin login
  adminLogin: (email: string, password: string) =>
    fetch(`${BASE}/admin/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  // Machines
  getMachines: (token: string) =>
    fetch(`${BASE}/machines/`, {
      headers: { authorization: token },
    }).then(r => r.json()),

  getMachineStatus: (id: number, token: string) =>
    fetch(`${BASE}/machines/${id}/status`, {
      headers: { authorization: token },
    }).then(r => r.json()),

  restockTickets: (id: number, amount: number, token: string) =>
    fetch(`${BASE}/machines/${id}/restock`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: token },
      body: JSON.stringify({ amount }),
    }).then(r => r.json()),

  addCash: (id: number, denomination: number, quantity: number, token: string) =>
    fetch(`${BASE}/machines/${id}/cash`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: token },
      body: JSON.stringify({ denomination, quantity }),
    }).then(r => r.json()),

  // Adjust ticket
  adjustTicket: (ticket_id: number, new_station_id: number, token: string) =>
    fetch(`${BASE}/ticket/adjust-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: token },
      body: JSON.stringify({ ticket_id, new_station_id }),
    }).then(r => r.json()),
};

export interface Station {
  id: number;
  code: string;
  name: string;
  name_en: string;
  line: "blue" | "purple";
  x: number;
  y: number;
  connect_to: string | null;
}
