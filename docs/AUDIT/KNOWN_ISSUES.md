# Known Issues & Technical Debt

This file tracks open issues, limitations, and future optimization paths.

---

## 1. Initial Integration Dependencies
* **Symptom:** AI features depend on a configured Claude API key.
* **Workaround:** If `CLAUDE_API_KEY` is not present in environment variables, the system will fall back to a mock financial insight rule engine to prevent crashes.
* **Resolution:** Ensure keys are configured in Vercel or local `.env.local` prior to production.

---

## 2. OCR File Limit
* **Symptom:** Parsing high-resolution PDFs through LLM vision might trigger payload size errors or slow responses.
* **Workaround:** Limit file uploads to 5MB and compress receipt images on the client side using `browser-image-compression` before transmission.

---

## 3. Offline Data Synchronization conflict
* **Symptom:** If a user logs transactions offline on two different devices before syncing, timestamp ordering might conflict.
* **Workaround:** Supabase database triggers apply last-write-wins (LWW) strategy based on `updated_at` server-side timestamps.
