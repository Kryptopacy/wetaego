# Enterprise Team & Intercom Orchestration

Managing a high-traffic business requires seamless internal communication and strict operational oversight.

---

## 1. Department Workstation & Intercom Architecture

```mermaid
flowchart TD
    NewOrder(["Incoming Order / Service Request"]) --> Dispatcher["Workstation Dispatch Engine"]

    Dispatcher -->|"Food Category"| Kitchen["Kitchen Display System (KDS)"]
    Dispatcher -->|"Cocktail Category"| Bar["Bar Display Workstation"]
    Dispatcher -->|"Service / Booking"| Specialist["Assigned Specialist Calendar"]
    Dispatcher -->|"Staff Call / AI Escalation"| FloorStaff["Floor Staff Alert (Sound Chime)"]

    Kitchen <-->|"Department Intercom (WebSocket)"| Bar
    Kitchen <-->|"Department Intercom"| FloorStaff

    subgraph AuditTrail ["Managerial Audit Trail & Payroll"]
        ShiftClock["Geofenced Staff Timeclock"]
        AuditLogs["Immutable Action Logs (user_id stamped)"]
    end

    style NewOrder fill:#0284c7,stroke:#38bdf8,color:#fff
    style Dispatcher fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Kitchen fill:#78350f,stroke:#fbbf24,stroke-width:2px,color:#fff
    style Bar fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style FloorStaff fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff
    style AuditTrail fill:#1e293b,stroke:#a855f7,stroke-width:2px,color:#fff
```

---

## 2. Department Routing

Workflows are intelligently routed based on department:

- Physical items are routed to Kanban workstations (Kitchen, Bar, Grill) based on category.
- Custom service bookings are routed to the specific calendar of the assigned staff member.

---

## 3. Realtime Chat & WebSockets

A dedicated Intercom module powered by Supabase WebSockets enables zero-latency internal communication.

- **Rich Media Sharing:** Waitstaff can securely snap photos of complicated tables or incidents and instantly upload them to the internal chat.
- **Persistent Channels:** Chat channels are permanently scoped to the organization and isolated from public access.

---

## 4. Managerial Oversight

- **Action Logs:** Critical administrative actions (such as voiding an order, manually restocking inventory, or granting Store Credit) are immutably logged with the `user_id` of the actor to ensure full accountability.
- **Shift Auditing:** Managers can export historical Geofenced Clock-In records to reconcile payroll disputes instantly.
