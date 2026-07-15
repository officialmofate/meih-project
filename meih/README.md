# MEIH — MOFATE Event & Innovation Hub

A dual-module platform combining an **Event Planning Marketplace** and an
**Innovation Competition & Voting Platform**, built for the Tanzanian market.

## Project Structure

```
meih/
├── frontend/          # HTML5 + CSS3 + Vanilla JS client
│   ├── pages/         # 15 page templates (landing, auth, events, innovation, dashboards)
│   ├── css/           # Modular CSS with variables, components, themes, responsive
│   ├── js/            # ES modules: API client, auth, router, state, components
│   └── assets/        # Images, fonts, icons
├── backend/           # Node.js + Express REST API + Socket.IO
│   └── src/
│       ├── controllers/   # 11 controllers (auth, user, event, booking, innovation, payment, planner, vendor, notification, admin, ai)
│       ├── services/      # 10 services with PostgreSQL queries
│       ├── middleware/     # Auth (JWT), validation, error handling
│       ├── routes/        # 11 route files
│       └── websocket/     # Socket.IO for real-time chat & leaderboard
├── database/
│   └── migrations/    # 10 SQL migration files (20+ tables)
└── docker/
    ├── Dockerfile     # Multi-stage Node.js build
    ├── docker-compose.yml  # PostgreSQL, Redis, backend, Nginx
    └── nginx.conf     # Reverse proxy config
```

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env   # fill in secrets and DB/Redis URLs
npm install
npm run dev            # starts with nodemon hot reload
```

### Frontend
The backend serves the frontend statically in development. Once the backend
is running, open `http://localhost:4000/pages/landing.html`.

Alternatively, serve the `frontend/` folder with any static file server.

### Full stack (Docker)
```bash
cd docker
docker compose up --build
```
This starts PostgreSQL, Redis, the backend API, and Nginx serving the frontend.
SQL migrations and seed data run automatically on first boot.

## API Overview

All endpoints are prefixed with `/api/v1/`. Key groups:

| Group | Endpoints | Auth |
|-------|-----------|------|
| `/auth` | register, login, verify-email, verify-phone, forgot/reset password, refresh, logout | Public (mostly) |
| `/users` | profile, change password, list, delete | Authenticated |
| `/events` | CRUD, categories, publish, quotes, bookings | Mixed |
| `/planners` | list, detail, portfolio, events, reviews, availability | Mixed |
| `/vendors` | list, detail, portfolio, bookings, reviews, availability | Mixed |
| `/bookings` | CRUD, confirm, cancel, invoice | Authenticated |
| `/innovation` | competitions, submissions, voting, comments, leaderboard, judge scoring | Mixed |
| `/payments` | methods, CRUD, callback, invoices | Mixed |
| `/notifications` | list, read, mark all read, delete | Authenticated |
| `/admin` | dashboard, users, events, payments, analytics, settings | Admin only |

## User Roles

- **Event Client** — Create events, compare vendors, pay deposits, track progress
- **Event Planner** — Company profile, portfolio, manage bookings, availability
- **Vendor** — Business profile, portfolio, manage bookings, reviews
- **Innovator** — Submit innovations, upload materials, track votes
- **Innovator Manager** — Manage competitions, invite sponsors
- **Judge** — Score innovations against rubric, view rankings
- **Public Voter** — Browse innovations, OTP-verified voting
- **Admin** — User management, platform oversight, system settings

## Payment Integrations

Mobile money and bank transfer payments with screenshot proof verification.
Planners and vendors configure their payment receiving details in their dashboards.

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES modules)
- **Backend**: Node.js, Express.js, Socket.IO, JWT
- **Database**: PostgreSQL, Redis
- **Infrastructure**: Docker, Nginx
