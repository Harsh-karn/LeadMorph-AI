# LeadMorph AI - Intelligent CRM Importer 🚀

LeadMorph AI is a full-stack, AI-powered CSV import tool that intelligently extracts, maps, and validates CRM lead information from messy, unstandardized CSV files. 

It completely eliminates the need for manual data mapping by leveraging the **Gemini 2.5 Flash** LLM to dynamically understand columns, infer missing data, and map it strictly into a unified CRM format.

## ✨ Features

- **Intelligent Field Mapping**: Upload any CSV (Facebook Leads, Google Ads, arbitrary spreadsheets) and the AI automatically understands the context and maps it to the target schema.
- **Robust AI Batching & Retry Engine**: Processes massive CSVs by chunking them into memory-efficient batches. If the AI hallucinates or hits a rate limit, the system automatically uses **Exponential Backoff** to retry the batch safely.
- **Zero-State Architecture**: The importer is entirely stateless. Files are processed securely in memory via `multer` without ever touching the disk, and structured JSON is returned instantly.
- **Beautiful UX**: Features a modern, responsive React interface inspired by premium CRMs, complete with Drag & Drop (`react-dropzone`), smooth progress indicators, sticky-header preview tables, and detailed success/failure reporting.

## 🛠 Tech Stack

- **Frontend:** Next.js (React), standard CSS (No heavy UI libraries to keep the bundle extremely lightweight).
- **Backend:** Node.js, Express, TypeScript.
- **AI Engine:** Google Gemini API (`@google/genai`).

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A Gemini API Key (Get one for free at [Google AI Studio](https://aistudio.google.com/))

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_api_key_here
BATCH_SIZE=5
```

Start the backend development server:
```bash
npm run dev
```

### 2. Frontend Setup

Open a new terminal window:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to start importing leads!

## 🧠 AI Validation Rules

The backend strictly enforces the following rules to ensure absolute data integrity before it reaches your database:
1. **Status Constraints:** `crm_status` must strictly be one of `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, or `SALE_DONE`.
2. **Missing Contacts:** If a record is missing BOTH an email and a mobile number, it is safely marked as "Skipped" with a failure reason.
3. **Data Compression:** Extra phone numbers, secondary emails, or ambiguous remarks found in the CSV are intelligently compressed and appended into the `crm_note` field.

## 🏗 Additional Credit Implemented

✅ **Drag & Drop Upload**: Integrated seamless file dropping.
✅ **Progress Indicators**: Animated, real-time UI feedback while waiting for AI generation.
✅ **Retry Mechanism**: Backend automatically catches JSON parse failures and rate limits, retrying the specific chunk up to 3 times with exponential backoff before safely skipping it.
✅ **Well-Written Setup Instructions**: You're reading them! 😉
