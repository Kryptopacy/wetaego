# Inventory Manager & Component Breakdown (BOM)

OurMenu OS provides a purpose-built, real-time stock management system designed for any physical business—from roadside grills and bustling cafes to high-volume tech retailers—that needs to track tangible assets without the friction of a legacy ERP.

---

## 1. Bill of Materials (BOM) & Inventory Lifecycle

```mermaid
flowchart TD
    OrderEvent(["Order Paid / Placed"]) --> OrderItem["Catalog Item (e.g. Classic Burger)"]
    
    OrderItem --> BOMLookup{"Has BOM Recipe?"}
    BOMLookup -->|"Yes"| RecipeLookup["Lookup BOM Components (Buns, Patties, Cheese)"]
    BOMLookup -->|"No"| DirectDeduct["Direct Item Stock Decrement"]
    
    RecipeLookup --> MovementInsert["Insert inventory_movements (type: 'sale')"]
    DirectDeduct --> MovementInsert
    
    MovementInsert --> DBTrigger["PostgreSQL Trigger (sync_inventory_quantity)"]
    DBTrigger --> StockUpdate["Atomically Update inventory_items.current_quantity"]
    
    StockUpdate --> ThresholdCheck{"current_quantity <= low_stock_threshold?"}
    ThresholdCheck -->|"Yes, > 0"| LowStockAlert["Dashboard 'Low Stock' Warning"]
    ThresholdCheck -->|"Yes, <= 0"| SoldOut["Auto-mark item as 'sold_out'"]
    ThresholdCheck -->|"No"| OK["Healthy Stock Level"]

    style OrderEvent fill:#0284c7,stroke:#38bdf8,color:#fff
    style OrderItem fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style RecipeLookup fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff
    style DBTrigger fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff
    style SoldOut fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fff
```

---

## 2. Live Item Ledger

Every item has a running quantity, category, unit, SKU, optional cost price, reorder threshold, and notes. Items are firmly scoped per-location, ensuring multi-branch organizations stay fully isolated.

---

## 3. Component Breakdown (BOM) Engine

We eliminate manual count audits by tracking raw materials automatically:

- Dynamically map catalog products to required raw materials (e.g., a "Classic Burger" requires 1 "Bun", 1 "Patty", and 20g "Cheddar").
- When a product is sold, the system atomically calculates historical **Cost of Goods Sold (COGS)** and deducts the exact ingredient quantities from the ledger.

---

## 4. 5 Movement Types & Signed Triggers

- Track `Restock`, `Use`, `Wastage/Loss`, `Sale`, and `Manual Adjustment` — each with an optional note for accountability.
- A strictly enforced Postgres trigger (`sync_inventory_quantity`) atomically applies every movement to the item's `current_quantity`, making the entire ledger safe against race-conditions during viral traffic spikes.
- Outbound movements (Use, Sale, Wastage) actively block submission at the database layer if the stock would drop below zero.

---

## 5. Smart Sell-Out & Order Cancellation

- **Atomic Sell-Out Tracking:** Items automatically switch to a visible *Sold Out* state instantly when availability reaches zero.
- **Cancellation Lifecycle:** Businesses can safely reject orders with a logged reason for analytics. The engine provides the option to instantly restock the rejected inventory back into the ledger.
- **Optimistic UI Validation:** Waitstaff and managers can modify stock limits dynamically from the dashboard without ever triggering a page refresh.
