# ⚡ LeadMorph AI — Intelligent CSV Importer

> AI-powered CSV importer that intelligently extracts CRM lead information from **any** CSV format and maps it to GrowEasy CRM fields using a local LLM (Ollama).

**Submission for:** Software Developer (Intern / Full-Time) — GrowEasy

---

## 🎯 What It Does

Upload any CSV file (Facebook Lead Export, Google Ads, Real Estate CRM, Sales reports, manually created spreadsheets) and the AI automatically:

1. **Parses** the CSV regardless of column naming convention
2. **Intelligently maps** columns to GrowEasy CRM fields using Llama 3.2
3. **Validates** extracted data (enum values, date formats, skip rules)
4. **Returns** structured JSON with parsed + skipped records and statistics

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | Node.js + Express (TypeScript) |
| AI | Ollama + Llama 3.2 (local LLM, no API key needed) |
| CSV Parsing | PapaParse (frontend), csv-parse (backend) |

---

## 🚀 Setup & Running Locally

### Prerequisites

- Node.js v18+ and npm
- [Ollama](https://ollama.com/download) installed

### 1. Install Ollama

Download and install Ollama from [ollama.com/download](https://ollama.com/download), then pull the model:

```bash
ollama pull llama3.2
```

### 2. Clone & Install

```bash
git clone https://github.com/Harsh-karn/LeadMorph-AI.git
cd LeadMorph-AI
```

### 3. Start the Backend

```bash
cd backend
cp .env.example .env   # Review settings
npm install
npm run dev
# Backend runs at http://localhost:4000
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:3000
```

### 5. Ensure Ollama is Running

```bash
ollama serve
```

Then open http://localhost:3000 in your browser.

---

## 🧠 AI Prompt Engineering

The system prompt instructs the LLM to:

- **Intelligently map** any column name to the correct CRM field (e.g. "Full Name" → `name`, "Phone Number" → `mobile_without_country_code`)
- **Enforce strict enum values** for `crm_status` and `data_source`
- **Handle multiple emails/phones** — use first, append rest to `crm_note`
- **Skip invalid records** that have neither email nor mobile
- **Process in batches** of 15 rows with up to 3 retries per batch

### CRM Fields Extracted

| Field | Description |
|-------|-------------|
| `created_at` | Lead creation date |
| `name` | Lead full name |
| `email` | Primary email |
| `country_code` | Dial code (+91, +1, etc.) |
| `mobile_without_country_code` | Mobile number |
| `company` | Company name |
| `city` | City |
| `state` | State/Province |
| `country` | Country |
| `lead_owner` | Lead owner |
| `crm_status` | GOOD_LEAD_FOLLOW_UP / DID_NOT_CONNECT / BAD_LEAD / SALE_DONE |
| `crm_note` | Notes, extra emails/phones, remarks |
| `data_source` | leads_on_demand / meridian_tower / eden_park / varah_swamy / sarjapur_plots |
| `possession_time` | Property possession time |
| `description` | Additional description |

---

## 📁 Project Structure

```
leadmorph-ai/
├── frontend/                  # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # Main 4-step import flow
│   │   │   ├── layout.tsx     # Root layout + metadata
│   │   │   └── globals.css    # Full design system
│   │   ├── components/
│   │   │   ├── DropZone.tsx   # Drag & drop uploader
│   │   │   ├── PreviewTable.tsx # Raw CSV preview
│   │   │   ├── ResultTable.tsx  # CRM results + tabs
│   │   │   └── ProgressBar.tsx  # AI processing progress
│   │   └── lib/
│   │       ├── api.ts         # Backend API client
│   │       └── csvParser.ts   # Client-side parsing
│   └── .env.local
│
└── backend/                   # Express API
    ├── src/
    │   ├── index.ts           # Server entry
    │   ├── routes/
    │   │   └── import.ts      # POST /api/import
    │   ├── services/
    │   │   ├── csvService.ts  # CSV buffer parser
    │   │   ├── aiService.ts   # Ollama LLM + batching + retry
    │   │   └── crmMapper.ts   # Validation + enum enforcement
    │   └── types/
    │       └── crm.ts         # CRM TypeScript interfaces
    └── .env.example
```

---

## ✨ Features

- ✅ Drag & Drop CSV upload
- ✅ File picker fallback
- ✅ Live CSV preview with sticky headers, horizontal/vertical scrolling
- ✅ AI batch processing (15 rows/batch) with retry (3 attempts)
- ✅ Progress indicator during AI processing
- ✅ Parsed / Skipped record tabs with counts
- ✅ Color-coded status badges
- ✅ Export parsed results to CSV
- ✅ Dark mode (default)
- ✅ Responsive design
- ✅ Error handling with helpful hints

---

## 📧 Submission

Built by **Harsh Karn** for the GrowEasy Software Developer assignment.

- GitHub: https://github.com/Harsh-karn/LeadMorph-AI
- Position: Software Developer Intern
