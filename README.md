<p align="center">
  <img src="./mrt_machines_banner_1778755408955.png" alt="Metamachines Banner" width="100%">
</p>

<h1 align="center">🚆 Metamachines</h1>

<p align="center">
  <strong>Modern MRT Ticketing & Management Kiosk System</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/FastAPI-0.109+-05998b.svg?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-15.0+-000000.svg?logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white" alt="Tailwind">
</p>

---

## 🌟 Overview

**Metamachines** is a comprehensive solution designed to modernize the Mass Rapid Transit (MRT) experience. It combines a sleek, high-performance kiosk interface for passengers with a robust backend for real-time station management and ticket processing.

Whether it's browsing station maps, purchasing tickets, or monitoring machine health, Metamachines provides a seamless, state-of-the-art interface for both commuters and administrators.

## ✨ Key Features

- 🗺️ **Dynamic Station Map**: Interactive route visualization for Blue and Purple lines.
- 🎟️ **Automated Ticketing**: Swift ticket issuance with transaction tracking.
- 🖥️ **Kiosk Interface**: Built with Tailwind CSS v4 for a premium, responsive feel.
- 📊 **Admin Dashboard**: Comprehensive control over stations and machine status.
- ⚡ **High Performance**: FastAPI backend ensuring low-latency operations.
- 🛡️ **Reliable Data**: SQLModel ORM with SQLite for robust data persistence.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: Lucide React
- **Language**: TypeScript

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **ORM**: [SQLModel](https://sqlmodel.tiangolo.com/)
- **Database**: SQLite
- **Runtime**: Python 3.10+

---

## 🚀 Getting Started

### 1. Backend Setup
```bash
cd MRTBackend
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

### 2. Frontend Setup
```bash
cd "MRT Frontend1/mrt"
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## 📂 Project Structure

```text
Mrtmachines/
├── MRT Frontend1/      # Next.js Application
│   └── mrt/            # Main project root
│       ├── app/        # Next.js App Router
│       └── components/ # UI Components
├── MRTBackend/         # FastAPI Application
│   ├── controllers/    # API Routes
│   ├── models/         # Database Models
│   └── schemas/        # Pydantic Schemas
└── README.md           # This file
```

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

