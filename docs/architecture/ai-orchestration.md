# AI-Native Operations & Tool Calls

OurMenuOS is structurally designed to be run *by* AI. We do not use AI as a novelty chatbot; it is deeply embedded into the operational workflows of both the merchant and the consumer.

## 1. The Business AI (Admin Copilot)

A deeply integrated, conversational assistant built directly into the merchant dashboard. The Copilot possesses profound domain knowledge of OurMenuOS and enforces strict Role-Based Access Control (RBAC).

- **Autonomous Tool Calls:** Instead of manually navigating menus, an admin can type "Create a new Winter category and add 3 coats to it." The AI autonomously executes `createCategory` and `createItem` tool calls, directly mutating the database.
- **Data Protection:** The Copilot evaluates the user's RBAC scope. If a low-level staff member asks for "this month's revenue report," the Copilot actively blocks the request.
- **AI Demand Forecasting (`/api/ai/forecast`):** The AI analyzes 30-day sales velocity and utilizes Google Gemini to predict 7-day demand trajectories, issuing smart inventory alerts (Critical, Order Soon, Sufficient).

## 2. The Public AI (Customer Experience)

The customer-facing AI removes the friction of browsing massive catalogs.

- **Voice Dictation & Hands-Free UI:** Customers can use natural voice dictation via the Web Speech API. The AI translates raw speech ("I want a large pepperoni pizza, no olives") into specific parameters.
- **Cart Mutation Tool Calls:** The AI natively executes tool calls to autonomously manage the shopping cart (`addToCart`, `removeFromCart`).
- **Real-Time Staff Pinging:** If a customer asks a highly specific question the AI doesn't know, the AI can execute a `callWaiter` tool call, immediately sending a Web Push Notification to the staff dashboard.
- **Smart Upselling Engine (`/api/upsell`):** Intelligent checkout add-on engine dynamically analyzes cart contents to suggest highly relevant cross-sells, maximizing Average Order Value (AOV).

## 3. Generative Tools & Data Ingestion

- **Multimodal Menu Importer:** Powered by Gemini Vision. Physical menus can be photographed and instantly parsed into structured digital catalogs with superior spatial understanding, replacing legacy OCR techniques.
- **AI Copywriter & Image Studio:** Generative AI deeply integrated into the Page Builder, assisting businesses in writing high-converting item descriptions and generating stunning, professional cover images on the fly.
