# AI Context File — ROMS
> Paste this file at the start of any AI conversation to get full context instantly.
> Keep this file updated as the project evolves.

---

## 1. What Is This Project?

**ROMS (Restaurant Order Management System)** is a SaaS web application for
small and mid-sized restaurants in India. It automates the complete order
processing flow — from a waiter taking a table order to bill delivery to
the customer.

**Problem it solves:** Restaurants still rely on paper-based ordering, which
causes wrong orders, slow kitchen communication, and delayed billing.

**Business Model:** Monthly subscription (₹999–₹2,999/month per restaurant)
+ one-time setup fee (₹2,000–₹5,000).

---

## 2. Core Workflow

```
Waiter opens app → Selects table → Browses menu → Adds to cart
      │
      ▼
Places order → Order saved to DB
      │
      ├──► Kitchen Display (real-time) → Kitchen prepares → Marks Ready
      └──► Billing Counter (real-time) → Monitors order status
                                              │
                                              ▼
                              One-click bill generation
                                              │
                                              ▼
                              Printed bill + WhatsApp/SMS to customer
```

---

## 3. User Roles

| Role | Device | What They Do |
|------|--------|-------------|
| Admin | Desktop | Manages menu, tables, staff, views reports |
| Waiter | Mobile/Tablet | Takes orders, monitors status |
| Kitchen Staff | Tablet/Screen | Views orders, marks items ready |
| Billing Counter | Desktop | Generates and sends bills |
| Customer | Their phone | Receives digital bill |

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 + Tailwind CSS |
| Backend | Node.js 20 + Express.js 4 |
| Real-time | Socket.io 4 |
| Database | PostgreSQL 15 |
| ORM | Prisma 5 |
| Auth | JWT (Role-based) |
| Bill Delivery | Twilio / Gupshup (WhatsApp + SMS) |
| Backend Hosting | Railway |
| Frontend Hosting | Vercel |

---

## 5. Database Tables (Summary)

```
users           → All staff accounts (role: admin | waiter | kitchen | billing)
restaurants     → One row per restaurant (SaaS multi-tenant)
tables          → Physical dining tables
menu_categories → Groups of menu items (Starters, Main Course, etc.)
menu_items      → Individual dishes with price
orders          → One order per table session
order_items     → Individual items within an order
bills           → Generated bill for a completed order
```

### Key Relationships
```
restaurants → has many → users, tables, menu_categories, orders
orders      → belongs to → tables, users (waiter)
orders      → has many → order_items
order_items → belongs to → menu_items
orders      → has one → bill
```

---

## 6. Order Status Flow

```
pending → confirmed → preparing → ready → served → billed
```

---

## 7. API Structure (Base URL: /api)

```
POST   /auth/login                    → Login, get JWT token
GET    /auth/me                       → Get current user

GET    /menu                          → Get full menu
POST   /menu/items                    → Add menu item (admin)
PUT    /menu/items/:id                → Update menu item (admin)

GET    /tables                        → Get all tables
POST   /tables                        → Add table (admin)
PATCH  /tables/:id/status             → Update table status

POST   /orders                        → Place new order (waiter)
GET    /orders                        → Get all active orders
PATCH  /orders/:id/status             → Update order status (kitchen/billing)
POST   /orders/:id/items              → Add more items to order

POST   /bills/generate/:orderId       → Generate bill (billing)
PATCH  /bills/:id/payment             → Mark as paid
POST   /bills/:id/send-whatsapp       → Send bill to customer
```

---

## 8. Real-time Socket Events

| Event | Triggered When | Who Receives |
|-------|---------------|-------------|
| `order:new` | New order placed | Kitchen, Billing |
| `order:status_updated` | Order status changes | Waiter, Billing |
| `order:item_ready` | Item marked ready | Waiter |
| `table:status_updated` | Table freed/occupied | Waiter |
| `bill:generated` | Bill created | Waiter |

All clients join a room: `restaurant_{id}` on connect.

---

## 9. Folder Structure

```
restaurant-oms/
├── backend/
│   └── src/
│       ├── config/        → DB + Socket setup
│       ├── middleware/    → JWT auth + role check
│       ├── routes/        → API route definitions
│       ├── controllers/   → Request handlers
│       └── services/      → Business logic
├── frontend/
│   └── src/
│       ├── pages/         → waiter/ kitchen/ billing/ admin/
│       ├── components/    → Reusable UI components
│       ├── context/       → AuthContext, SocketContext
│       ├── hooks/         → useSocket.js
│       └── services/      → api.js (Axios calls)
└── docs/
    ├── PRD.md
    ├── TDD.md
    ├── DB_SCHEMA.md
    └── AI_CONTEXT.md      ← You are here
```

---

## 10. Current Project Status

### Completed
- [x] Product Requirements Document (PRD)
- [x] Technical Design Document (TDD)
- [x] AI Context File (this file)
- [x] GitHub repo setup (restaurant-oms)
- [x] Notion workspace setup
- [x] GitHub Projects board + Milestones

### In Progress
- [ ] GitHub Issues for Phase 1
- [ ] Database schema (Prisma)
- [ ] Backend setup (Node.js + Express)

### Not Started
- [ ] Phase 1 — Core Order Flow
- [ ] Phase 2 — Bills & Notifications
- [ ] Phase 3 — Admin & Analytics

---

## 11. Development Phases

### Phase 1 — Core Order Flow (MVP)
Role-based login, menu management, waiter app, kitchen display,
billing counter, real-time sync via Socket.io.

### Phase 2 — Bills & Notifications
Bill generation with GST, thermal printing, WhatsApp/SMS delivery.

### Phase 3 — Admin & Analytics
Sales reports, table management, multi-restaurant support.

---

## 12. Key Engineering Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| ORM | Prisma | Type-safe, auto migrations |
| Real-time | Socket.io | Bi-directional, rooms support |
| Auth | JWT | Stateless, works across devices |
| Styling | Tailwind CSS | Fast, mobile-friendly |
| Hosting | Railway + Vercel | Free tier, simple deploys |

---

## 13. Environment Variables Needed

### Backend
```
PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN,
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
TWILIO_WHATSAPP_FROM, CLIENT_URL
```

### Frontend
```
REACT_APP_API_URL, REACT_APP_SOCKET_URL
```

---

## 14. Important Notes for AI Assistants

- This is a **solo developer project** — keep suggestions simple and practical
- Developer is learning — **explain concepts** before implementing
- Prefer **well-commented code** over clever/complex solutions
- Always follow the **folder structure** defined in Section 9
- When adding a new feature, always think about **which role** can access it
- All real-time updates go through **Socket.io rooms** (restaurant_{id})
- **Never hardcode** restaurant IDs — always use JWT payload values
- Keep **mobile-first** UI in mind (waiters use phones/tablets)
