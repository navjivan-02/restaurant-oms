# Product Requirements Document (PRD)
**Product:** Restaurant Order Management System (ROMS)  
**Author:** Navjivan Mehta  
**Version:** 1.0  
**Last Updated:** June 2026  
**Status:** Draft

---

## 1. Problem Statement

Small and mid-sized restaurants in India still rely on manual order taking — 
waiters write orders on paper, shout to the kitchen, and manually calculate 
bills. This leads to:

- Wrong orders due to handwriting errors
- Delayed communication between waiter and kitchen
- Slow billing process
- No digital record of orders
- Customer dissatisfaction due to wait times

Existing solutions like Petpooja and POSist are expensive (₹5,000–₹15,000/month)
and complex for small restaurant owners to adopt.

---

## 2. Target Users

| User | Role | Pain Point |
|------|------|------------|
| Restaurant Owner | Buys and manages the system | Wants to reduce errors, speed up service |
| Waiter | Takes orders on tablet/mobile | Needs a fast, simple order-taking app |
| Kitchen Staff | Prepares food | Needs clear, ordered list of what to cook |
| Billing Counter Staff | Generates bills | Needs one-click bill generation |
| Customer | Receives bill | Wants quick service and digital bill |

---

## 3. Goals

### Business Goals
- Build a SaaS product deployable to restaurants across India
- Achieve ₹30,000/month recurring revenue with 20 restaurants at ₹1,500/month
- Provide a cheaper, simpler alternative to existing POS systems

### Product Goals
- Reduce order errors to near zero
- Cut order-to-kitchen time from ~5 minutes to under 30 seconds
- Enable one-click bill generation
- Provide digital bill delivery via WhatsApp/SMS

### Success Metrics
| Metric | Target |
|--------|--------|
| Order error rate | < 1% |
| Time to place order | < 1 minute |
| Bill generation time | < 10 seconds |
| Restaurant onboarding time | < 1 day |
| Monthly paying restaurants (6 months) | 10+ |

---

## 4. Features

### Phase 1 — Core Order Flow (MVP)
- [ ] Role-based login (Admin, Waiter, Kitchen, Billing)
- [ ] Menu management (Admin adds/edits items with price)
- [ ] Table management (Admin sets up tables)
- [ ] Waiter app — browse menu, add to cart, place order
- [ ] Kitchen display — see live incoming orders, mark as Ready
- [ ] Billing counter — see all active orders, track status
- [ ] Real-time order status sync across all devices (WebSocket)

### Phase 2 — Bills & Notifications
- [ ] One-click bill generation (itemized + GST)
- [ ] Print bill on thermal printer
- [ ] Send digital bill to customer via WhatsApp / SMS
- [ ] Order history per table

### Phase 3 — Admin & Analytics
- [ ] Daily/weekly sales reports
- [ ] Most ordered items report
- [ ] Table occupancy tracking
- [ ] Multi-restaurant support (for SaaS scaling)
- [ ] Staff management (add/remove staff accounts)

---

## 5. Out of Scope (v1)

- Online ordering (Swiggy/Zomato style)
- Customer-facing self-ordering via QR code
- Inventory management
- Accounting / GST filing integration
- Mobile app (native iOS/Android) — web app only for now

---

## 6. User Flows

### Waiter Flow
```
Login → Select Table → Browse Menu → Add Items to Cart 
→ Place Order → Monitor Status → Serve when Ready
```

### Kitchen Flow
```
Login → See Incoming Orders (real-time) → Prepare in Order 
→ Mark Order as Ready
```

### Billing Flow
```
Login → See All Active Orders → Click Generate Bill 
→ Print + Send to Customer
```

### Admin Flow
```
Login → Manage Menu → Manage Tables → Manage Staff 
→ View Reports
```

---

## 7. Assumptions & Constraints

### Assumptions
- Restaurant has WiFi or mobile data available
- Waiter has a basic Android tablet or smartphone
- Kitchen has a basic tablet or screen
- Billing counter has a desktop/laptop with thermal printer

### Constraints
- Must work on low-end Android devices (2GB RAM)
- Must work on slow internet (2G/3G in some areas)
- UI must be simple enough for non-tech-savvy staff
- Must support Hindi/English interface (Phase 2)
- Monthly cost must be under ₹2,000 for small restaurants

---

## 8. Tech Stack (Summary)

| Layer | Technology |
|-------|------------|
| Frontend | React.js (Web) |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Database | PostgreSQL |
| Auth | JWT + Role-based |
| Bill Delivery | WhatsApp Business API / Twilio |
| Hosting | Railway / Render (free tier to start) |

---

## 9. Timeline

| Phase | Duration | Target |
|-------|----------|--------|
| Phase 1 - MVP | 6–8 weeks | Working core order flow |
| Phase 2 - Bills | 3–4 weeks | Full billing + notifications |
| Phase 3 - Analytics | 4–5 weeks | Reports + multi-restaurant |
| Beta Testing | 2 weeks | 2–3 real restaurants |
| Launch | Week 16 | First paying customers |

---

## 10. Open Questions

- [ ] Should we support QR-based self-ordering in v2?
- [ ] Which WhatsApp API provider is cheapest for India? (Twilio vs Gupshup vs Interakt)
- [ ] Do we need offline mode if internet drops mid-service?
- [ ] Should kitchen display auto-refresh or require manual refresh as fallback?
