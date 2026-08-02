# 🤖 Apex Enterprise AI Customer Support & Refund Operations Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8e44ad?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o_Mini-00a67e?style=for-the-badge&logo=openai)](https://openai.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

An enterprise-grade, back-office customer support agent command center (built like **Zendesk / Intercom / Salesforce Service Cloud**) using **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Google Gemini 1.5 API / OpenAI GPT-4o**, and **Web Audio API**.

This platform equips e-commerce support teams and autonomous AI agents to co-pilot customer support tickets, process or deny refunds using dynamic tool validation against a live **15-customer CRM database**, inspect real-time **LLM reasoning telemetry**, and run a **Live Voice Telephony Dispatch Console**.

---

## 📋 Table of Contents
- [🌟 Key Features](#-key-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🤖 Autonomous 4-Step Agent Loop](#-autonomous-4-step-agent-loop)
- [📦 15-Customer CRM Database & Edge Cases](#-15-customer-crm-database--edge-cases)
- [🎙️ Dual Voice & Telephony Console](#️-dual-voice--telephony-console)
- [⚡ Getting Started](#-getting-started)
- [🧪 Live Demo Evaluation Scenarios](#-live-demo-evaluation-scenarios)
- [🛡️ Security & Vercel Serverless Hardening](#️-security--vercel-serverless-hardening)

---

## 🌟 Key Features

### 1. 🏢 Enterprise Support Queue & Co-Pilot Command Center (`Tickets & Co-Pilot`)
- **3-Column SaaS Layout**:
  - **Column 1: Support Queue**: Filter by `ALL`, `OPEN`, `ESCALATED`, `RESOLVED`. Displays ticket priority, customer risk score, and order preview.
  - **Column 2: Live Conversation & Co-Pilot**: Features a **Supervisor Manual Takeover Toggle** (switch between Autonomous AI Agent and Manual Human Agent), quick preset macro triggers, and inline decision receipts.
  - **Column 3: Live Customer 360 Context**: Customer tier badges, total spend, fraud risk score, delivery days elapsed, item return conditions, policy matrix checklist, and instant 1-click refund controls.

### 2. 🎙️ Live Voice Telephony Dispatch Console (`Voice Console`)
- **Single-Column Sleek Layout**: Centered audio command center with 32-bar animated soundwave frequency visualizer.
- **Continuous Speech Recognition (STT)**: Configured with `r.continuous = true` and high-accuracy `en-US` locale. Supports natural speech pauses without premature cut-offs.
- **Dual Live Line-by-Line Transcription Log**: Displays customer spoken input (`CUSTOMER STT`) and AI agent audio output (`AI AGENT TTS`) in real-time.
- **Natural Voice Synthesis (TTS)**: Plays audio responses via OpenAI `tts-1` cloud MP3 streaming or browser natural human voices (`0.95x` conversational speed with interactive slider).

### 3. 🧠 Real-Time Telemetry & Reasoning Inspector (`Agent Telemetry`)
- **Step-by-Step Thought Trace**: Displays the LLM's full internal reasoning chain (Step 1 `lookup_customer` ➔ Step 2 `get_order_details` ➔ Step 3 `check_policy_rules` ➔ Step 4 `process_refund`/`deny_refund`).
- **Tool Execution Payloads**: View raw JSON input parameters and CRM observation responses for complete auditability.

### 4. 🗃️ CRM Directory & Policy Viewer (`Data & Rules`)
- **15 Customer Profiles**: Complete CRM database inspector with detailed purchase histories, delivery dates, item conditions, and fraud risk scores.
- **Refund Policy Rule Matrix**: Interactive rule matrix filterable by category (*Time Windows*, *Condition Restrictions*, *Non-Refundable Categories*, *Tier Extensions*).

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────────────┐
                                  │      Next.js 14 Web Platform      │
                                  │ (App Router + Tailwind SaaS Theme)│
                                  └─────────────────┬─────────────────┘
                                                    │
                 ┌──────────────────────────────────┼──────────────────────────────────┐
                 │                                  │                                  │
                 ▼                                  ▼                                  ▼
     ┌───────────────────────┐          ┌───────────────────────┐          ┌───────────────────────┐
     │  Tickets & Co-Pilot   │          │ Live Voice Console    │          │  Admin Telemetry Log  │
     │  (3-Column Workspace) │          │ (STT / Web Audio/ TTS)│          │ (Reasoning Step Inspector)│
     └───────────┬───────────┘          └───────────┬───────────┘          └───────────┬───────────┘
                 │                                  │                                  │
                 └──────────────────────────────────┼──────────────────────────────────┘
                                                    │
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │    /api/chat API Route        │
                                    │ (Google Gemini 1.5 / OpenAI)  │
                                    └───────────────┬───────────────┘
                                                    │
                                                    ▼
                                    ┌───────────────────────────────┐
                                    │   Autonomous Agent Engine     │
                                    │   (4-Step Control Loop)       │
                                    └───────────────┬───────────────┘
                                                    │
                 ┌──────────────────────────────────┼──────────────────────────────────┐
                 ▼                                  ▼                                  ▼
     ┌───────────────────────┐          ┌───────────────────────┐          ┌───────────────────────┐
     │   lookup_customer     │          │   get_order_details   │          │  check_policy_rules   │
     │  (CRM Profile Match)  │          │(Delivery & Status)    │          │ (Official Matrix Check)│
     └───────────────────────┘          └───────────────────────┘          └───────────────────────┘
```

---

## 🤖 Autonomous 4-Step Agent Loop

The agent backend strictly enforces a sequential tool execution pipeline to guarantee **zero hallucinations** and **policy compliance**:

| Step | Action Tool | Operational Purpose |
| :---: | :--- | :--- |
| **Step 1** | `lookup_customer` | Normalizes input query, parses Order IDs (`ORD-1001`), and fetches CRM customer profile & order history. |
| **Step 2** | `get_order_details` | Retrieves carrier delivery date, calculates days elapsed since delivery, and checks item return conditions. |
| **Step 3** | `check_policy_rules` | Evaluates order against official policy matrix (`RULE-30D`, `RULE-FINAL-SALE`, `RULE-DAMAGE-DEFECT`, `RULE-ALREADY-REFUNDED`). |
| **Step 4** | `process_refund` / `deny_refund` | Generates a transaction ID for approved refunds or synthesizes a policy-grounded denial citation. |

---

## 📦 15-Customer CRM Database & Edge Cases

The CRM database ([src/data/crm-data.ts](file:///e:/AI-Customer-Support-Agent/src/data/crm-data.ts)) includes 15 explicit customer profiles covering all real-world edge cases:

| Customer ID | Name | Tier | Risk Score | Order ID | Scenario / Edge Case Description | Expected Result |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| `CUST-1001` | Sarah Jenkins | VIP | 5 | `ORD-1001` | Standard return within 30 days (Unopened Headphones). | **APPROVED** ($149.99) |
| `CUST-1003` | Elena Rostova | Regular | 10 | `ORD-1003` | Item damaged on arrival (Ceramic Coffee Set). | **APPROVED** ($185.00) |
| `CUST-1004` | David Miller | Regular | 15 | `ORD-1004` | Delivery > 30 days ago (53 days elapsed). | **DENIED** (`RULE-30D`) |
| `CUST-1005` | Chloe Bennett | Regular | 15 | `ORD-1005` | Clearance item marked as Final Sale. | **DENIED** (`RULE-FINAL-SALE`) |
| `CUST-1006` | Victor Lawson | Regular | 88 | `ORD-1006` | High fraud risk score (88/100). | **ESCALATED** (Supervisor) |
| `CUST-1007` | Amanda Chen | VIP | 12 | `ORD-1007` | Non-refundable category (Digital License). | **DENIED** (`RULE-DIGITAL`) |
| `CUST-1008` | Robert Taylor | Regular | 20 | `ORD-1008` | Personal hygiene category (Opened Electric Toothbrush). | **DENIED** (`RULE-HYGIENE`) |
| `CUST-1010` | James Wilson | VIP | 10 | `ORD-1010` | Delivery 38 days ago (Extended 45d VIP window). | **APPROVED** ($220.00) |
| `CUST-1011` | Hannah Kim | Regular | 5 | `ORD-1011` | Order status is still In Transit. | **DENIED** (`RULE-NOT-DELIVERED`) |
| `CUST-1015` | Grace Adams | New | 10 | `NONE` | Registered account with zero purchase order history. | **DENIED** (No Orders) |

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/suryasubhrajit/apex.git
cd apex
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# Google Gemini API Key (Get a free key at https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key (Optional for GPT-4o & Cloud TTS)
OPENAI_API_KEY=your_openai_api_key_here

# Default AI Provider (gemini | openai)
AI_PROVIDER=gemini
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to launch the platform.

---

## 🧪 Live Demo Evaluation Scenarios

### Scenario A: Standard Refund Approval
1. Open the platform on `http://localhost:3000`.
2. Click ticket **`TCK-1001`** (Sarah Jenkins).
3. Click the preset macro button `✅ Approve ORD-1001` or type:
   > *"I want to request a refund for Order #ORD-1001"*
4. The AI agent will execute the 4-step tool loop, issue a 100% refund ($149.99), and output transaction ID `TXN-REF-XXXXXX`.
5. Click **`>_ Logs (4)`** on the message bubble to view the live reasoning trace.

### Scenario B: Strict Policy Denial (Final Sale)
1. Click ticket **`TCK-1005`** (Chloe Bennett).
2. Click the preset macro `❌ Final Sale ORD-1005` or type:
   > *"I want to return the dress from Order #ORD-1005"*
3. The AI agent detects `isFinalSale: true`, denies the refund, and cites rule **`[RULE-FINAL-SALE]`**.

---

## 🛡️ Security & Vercel Serverless Hardening

- **Vercel Serverless Configurations**: Server routes (`/api/chat`, `/api/tts`, `/api/reset`) export `maxDuration = 30` and `dynamic = "force-dynamic"` to eliminate serverless timeout crashes.
- **Zero Client Secret Exposure**: API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) are kept strictly server-side without `NEXT_PUBLIC_` prefixes.
- **Graceful Error Fallbacks**: If external API limits are reached, the system gracefully falls back to the local autonomous reasoning engine with `HTTP 200 OK`.
