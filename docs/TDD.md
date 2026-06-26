# Technical Design Document (TDD)
**Product:** Restaurant Order Management System (ROMS)  
**Author:** Navjivan Mehta  
**Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Draft

---

## 1. System Architecture

### High Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENTS                          │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Waiter App  │  │Kitchen Display│  │Billing Counter│  │
│  │  (React.js)  │  │  (React.js)  │  │  (React.js)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
          │   REST API + WebSocket (Socket.io) │
          │                 │                  │
┌─────────┼─────────────────┼──────────────────┼──────────┐
│         ▼                 ▼                  ▼          │
│              Node.js + Express Server                   │
│                                                         │
│   ┌─────────────┐    ┌─────────────┐                   │
│   │  REST API   │    │  Socket.io  │                   │
│   │  (Routes)   │    │  (Events)   │                   │
│   └──────┬──────┘    └──────┬──────┘                   │
│          │                  │                           │
│   ┌──────▼──────────────────▼──────┐                   │
│   │         Business Logic         │                   │
│   │    (Controllers / Services)    │                   │
│   └──────────────┬─────────────────┘                   │
│                  │                                      │
│   ┌──────────────▼─────────────────┐                   │
│   │         PostgreSQL DB          │                   │
│   └────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### Architecture Pattern
- **Frontend:** Single Page Application (SPA) with React.js
- **Backend:** REST API + WebSocket server (Node.js + Express + Socket.io)
- **Database:** PostgreSQL (relational)
- **Auth:** JWT (JSON Web Token) with Role-Based Access Control
- **Real-time:** Socket.io for live order updates

---

## 2. Tech Stack (Detailed)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React.js | 18.x | UI for all roles |
| Styling | Tailwind CSS | 3.x | Fast, clean UI |
| Backend | Node.js | 20.x | Server runtime |
| Framework | Express.js | 4.x | REST API routing |
| Real-time | Socket.io | 4.x | WebSocket events |
| Database | PostgreSQL | 15.x | Data storage |
| ORM | Prisma | 5.x | DB queries (type-safe) |
| Auth | JWT | - | Stateless auth tokens |
| Validation | Zod | 3.x | Request validation |
| Bill SMS | Twilio / Gupshup | - | WhatsApp + SMS |
| Hosting | Railway | - | Backend + DB hosting |
| Frontend Host | Vercel | - | React app hosting |

---

## 3. Database Schema

### Overview of Tables
```
users
restaurants
tables
menu_categories
menu_items
orders
order_items
bills
```

### 3.1 users
Stores all staff accounts across all restaurants.

```sql
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,         -- bcrypt hashed
  role        VARCHAR(20) NOT NULL,          -- admin | waiter | kitchen | billing
  restaurant_id INT REFERENCES restaurants(id),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### 3.2 restaurants
One row per restaurant. This is how we support multiple restaurants (SaaS).

```sql
CREATE TABLE restaurants (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  address     TEXT,
  phone       VARCHAR(20),
  gst_number  VARCHAR(20),
  plan        VARCHAR(20) DEFAULT 'basic',   -- basic | pro
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### 3.3 tables
Physical dining tables in the restaurant.

```sql
CREATE TABLE tables (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT REFERENCES restaurants(id),
  table_number  VARCHAR(10) NOT NULL,        -- "T1", "T2", "VIP-1"
  capacity      INT DEFAULT 4,
  status        VARCHAR(20) DEFAULT 'free',  -- free | occupied
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### 3.4 menu_categories
Groups menu items (e.g. Starters, Main Course, Drinks).

```sql
CREATE TABLE menu_categories (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT REFERENCES restaurants(id),
  name          VARCHAR(100) NOT NULL,       -- "Starters", "Main Course"
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT true
);
```

### 3.5 menu_items
Individual dishes on the menu.

```sql
CREATE TABLE menu_items (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT REFERENCES restaurants(id),
  category_id   INT REFERENCES menu_categories(id),
  name          VARCHAR(150) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  is_veg        BOOLEAN DEFAULT true,
  is_available  BOOLEAN DEFAULT true,        -- can mark unavailable instantly
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### 3.6 orders
One order per table session.

```sql
CREATE TABLE orders (
  id            SERIAL PRIMARY KEY,
  restaurant_id INT REFERENCES restaurants(id),
  table_id      INT REFERENCES tables(id),
  waiter_id     INT REFERENCES users(id),
  status        VARCHAR(30) DEFAULT 'pending',
  -- pending | confirmed | preparing | ready | served | billed
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

### 3.7 order_items
Individual items within an order.

```sql
CREATE TABLE order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INT REFERENCES orders(id),
  menu_item_id  INT REFERENCES menu_items(id),
  quantity      INT NOT NULL DEFAULT 1,
  unit_price    DECIMAL(10,2) NOT NULL,      -- price at time of order
  status        VARCHAR(20) DEFAULT 'pending',
  -- pending | preparing | ready
  notes         TEXT,                        -- "less spicy", "no onion"
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### 3.8 bills
Generated bill for a completed order.

```sql
CREATE TABLE bills (
  id              SERIAL PRIMARY KEY,
  order_id        INT REFERENCES orders(id),
  restaurant_id   INT REFERENCES restaurants(id),
  subtotal        DECIMAL(10,2) NOT NULL,
  gst_percent     DECIMAL(5,2) DEFAULT 5.00,
  gst_amount      DECIMAL(10,2) NOT NULL,
  total_amount    DECIMAL(10,2) NOT NULL,
  payment_method  VARCHAR(20),               -- cash | upi | card
  payment_status  VARCHAR(20) DEFAULT 'unpaid', -- unpaid | paid
  customer_phone  VARCHAR(20),               -- for WhatsApp bill
  sent_via_whatsapp BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

### Entity Relationship (Summary)
```
restaurants
    │
    ├──── users (staff)
    ├──── tables
    ├──── menu_categories
    │         └──── menu_items
    └──── orders
              ├──── order_items ──── menu_items
              └──── bills
```

---

## 4. API Design

### Base URL
```
Development:  http://localhost:5000/api
Production:   https://roms-api.railway.app/api
```

### Auth Header (all protected routes)
```
Authorization: Bearer <jwt_token>
```

---

### 4.1 Auth Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /auth/login | Public | Login, returns JWT token |
| POST | /auth/logout | Any | Logout (client clears token) |
| GET | /auth/me | Any | Get current user info |

**POST /auth/login**
```json
Request:
{
  "email": "waiter1@restaurant.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Raju",
    "role": "waiter",
    "restaurantId": 1
  }
}
```

---

### 4.2 Menu Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /menu | waiter, billing | Get full menu with categories |
| POST | /menu/items | admin | Add new menu item |
| PUT | /menu/items/:id | admin | Update menu item |
| DELETE | /menu/items/:id | admin | Delete menu item |
| PATCH | /menu/items/:id/availability | admin | Toggle item availability |

---

### 4.3 Table Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | /tables | waiter, billing | Get all tables with status |
| POST | /tables | admin | Add new table |
| PATCH | /tables/:id/status | waiter | Update table status |

---

### 4.4 Order Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /orders | waiter | Place new order |
| GET | /orders | kitchen, billing | Get all active orders |
| GET | /orders/:id | any | Get single order details |
| PATCH | /orders/:id/status | kitchen, billing | Update order status |
| POST | /orders/:id/items | waiter | Add more items to order |

**POST /orders (Place Order)**
```json
Request:
{
  "tableId": 3,
  "items": [
    { "menuItemId": 5, "quantity": 2, "notes": "less spicy" },
    { "menuItemId": 8, "quantity": 1, "notes": "" }
  ]
}

Response:
{
  "orderId": 42,
  "status": "pending",
  "message": "Order placed successfully"
}
```

---

### 4.5 Bill Routes

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /bills/generate/:orderId | billing | Generate bill for order |
| GET | /bills/:id | billing | Get bill details |
| PATCH | /bills/:id/payment | billing | Mark bill as paid |
| POST | /bills/:id/send-whatsapp | billing | Send bill to customer |

---

## 5. Real-time Design (Socket.io)

### How It Works
```
1. All clients connect to Socket.io on page load
2. Each client joins a "room" for their restaurant
   e.g. socket.join("restaurant_1")
3. When an event happens → server emits to that room
4. All connected clients in that room receive it instantly
```

### Socket Events

| Event Name | Emitted By | Received By | Payload |
|------------|-----------|-------------|---------|
| `order:new` | Server | Kitchen, Billing | `{ orderId, tableNumber, items }` |
| `order:status_updated` | Server | Waiter, Billing | `{ orderId, status }` |
| `order:item_ready` | Server | Waiter | `{ orderId, itemId, itemName }` |
| `table:status_updated` | Server | Waiter | `{ tableId, status }` |
| `bill:generated` | Server | Waiter | `{ orderId, totalAmount }` |

### Event Flow Example
```
Waiter places order
      │
      ▼
POST /api/orders  (REST)
      │
      ▼
Server saves to DB
      │
      ▼
Server emits → order:new → restaurant_1 room
      │
      ├──► Kitchen Display receives → shows new order
      └──► Billing Counter receives → shows new order

Kitchen marks order ready
      │
      ▼
PATCH /api/orders/:id/status  (REST)
      │
      ▼
Server updates DB
      │
      ▼
Server emits → order:status_updated → restaurant_1 room
      │
      └──► Waiter App receives → shows "Order Ready!" notification
```

---

## 6. Auth & Role Design

### JWT Token Structure
```json
{
  "userId": 1,
  "role": "waiter",
  "restaurantId": 5,
  "iat": 1234567890,
  "exp": 1234654290        
}
```
Token expires in **24 hours**. User must login again after expiry.

### Role Permissions Matrix

| Feature | Admin | Waiter | Kitchen | Billing |
|---------|-------|--------|---------|---------|
| Login | ✅ | ✅ | ✅ | ✅ |
| View Menu | ✅ | ✅ | ❌ | ✅ |
| Manage Menu | ✅ | ❌ | ❌ | ❌ |
| Place Order | ❌ | ✅ | ❌ | ❌ |
| View Orders | ✅ | Own only | ✅ | ✅ |
| Update Order Status | ❌ | ❌ | ✅ | ✅ |
| Generate Bill | ❌ | ❌ | ❌ | ✅ |
| Manage Tables | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ❌ | ❌ | ❌ |
| Manage Staff | ✅ | ❌ | ❌ | ❌ |

---

## 7. Folder Structure

### Backend
```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              ← PostgreSQL connection
│   │   └── socket.js          ← Socket.io setup
│   ├── middleware/
│   │   ├── auth.js            ← JWT verification
│   │   └── roleCheck.js       ← Role-based access
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── menu.routes.js
│   │   ├── order.routes.js
│   │   ├── table.routes.js
│   │   └── bill.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── menu.controller.js
│   │   ├── order.controller.js
│   │   ├── table.controller.js
│   │   └── bill.controller.js
│   ├── services/
│   │   ├── bill.service.js    ← Bill calculation logic
│   │   └── whatsapp.service.js← WhatsApp/SMS sending
│   └── index.js               ← App entry point
├── prisma/
│   └── schema.prisma          ← DB schema (Prisma format)
├── .env
└── package.json
```

### Frontend
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── waiter/
│   │   │   ├── TableSelect.jsx
│   │   │   ├── Menu.jsx
│   │   │   └── OrderStatus.jsx
│   │   ├── kitchen/
│   │   │   └── KitchenDisplay.jsx
│   │   ├── billing/
│   │   │   ├── OrderList.jsx
│   │   │   └── BillGenerate.jsx
│   │   └── admin/
│   │       ├── Dashboard.jsx
│   │       ├── MenuManage.jsx
│   │       └── StaffManage.jsx
│   ├── components/
│   │   ├── OrderCard.jsx
│   │   ├── MenuItem.jsx
│   │   └── Cart.jsx
│   ├── context/
│   │   ├── AuthContext.jsx    ← JWT + user state
│   │   └── SocketContext.jsx  ← Socket.io connection
│   ├── hooks/
│   │   └── useSocket.js       ← Custom socket hook
│   ├── services/
│   │   └── api.js             ← Axios API calls
│   └── App.jsx
└── package.json
```

---

## 8. Environment Variables

### Backend (.env)
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/roms_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 9. Key Engineering Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| ORM | Prisma over raw SQL | Type-safe, auto migrations, great DX |
| Real-time | Socket.io over SSE | Bi-directional, rooms support, widely used |
| Auth | JWT over Sessions | Stateless, works across devices easily |
| Styling | Tailwind over CSS | Fast development, mobile-friendly |
| Hosting | Railway over AWS | Free tier, simple deploys, PostgreSQL included |
| Monorepo | Separate frontend/backend | Easier to manage for solo developer |

---

## 10. Open Technical Questions

- [ ] Should we use Prisma or raw pg queries? (Prisma recommended for speed)
- [ ] Do we need Redis for Socket.io when scaling to multiple servers?
- [ ] Should bill PDF be generated server-side or client-side (browser print)?
- [ ] Which WhatsApp provider for India — Twilio, Gupshup, or Interakt?
- [ ] Do we need a job queue (Bull) for sending WhatsApp messages async?
