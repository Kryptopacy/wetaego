# Industry Use Case: Services & Consulting (Salons, Spas, Tutors)

OurMenuOS utilizes a **Polymorphic Orders Engine** capable of treating time slots and abstract services with the exact same checkout resilience as physical retail goods.

## Data Flow: Deep Availability Engine

When a business configures an item as a "Service", the platform enforces timezone-aware availability checks.

```mermaid
graph TD
    subgraph Client [Customer Booking Flow]
        SelectService[Select Service<br>(e.g., 60m Massage)]
        PickTime[Pick Time Slot<br>Timezone Aware]
        PayDeposit[Pay Upfront Deposit<br>via Paystack]
    end

    subgraph Backend [OurMenuOS Core]
        Validation{Availability Engine<br>Is Slot Free?}
        DB[(PostgreSQL)]
        Milestones[Fulfillment Milestones<br>Draft -> Confirmed -> In Session]
    end

    SelectService --> PickTime
    PickTime --> Validation
    Validation -- Yes --> PayDeposit
    Validation -- No --> PickTime
    PayDeposit --> DB
    DB --> Milestones
```

## Key Services Features

1. **Custom Fulfillment Milestones:** The generic "To Do -> Done" Kanban board can be completely overridden per location. A bespoke tailor can use "Measurements -> Fitting -> Final Cut", while a Spa uses "Booked -> In Session -> Completed".
2. **Upfront Deposits:** Service businesses suffer from high no-show rates. The system enforces dynamic upfront deposit thresholds required to lock a calendar slot securely via Paystack.
3. **Independent Sub-Businesses:** A massive hotel can run a "Spa" sub-business totally isolated from its "Room Service" sub-business. The Spa team uses RBAC to only see their bookings, completely oblivious to food orders.
