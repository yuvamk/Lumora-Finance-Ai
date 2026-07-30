# Lumora AI — Security Architecture

This document describes the security policies, access control protocols, and threat mitigation models for Lumora AI.

---

## 1. Authentication & Session Management
* **Mechanism:** Managed by Supabase Auth (GoTrue service).
* **JWT Storage:** Handled via HTTP-only, secure, same-site cookies in the user's browser, preventing cross-site scripting (XSS) extraction.
* **Redirection Control:** Next.js Middleware intercepts request routes and validates session tokens before rendering pages.
* **OAuth Integrations:** Redirect links use strict host matching to prevent OAuth redirect hijacking.

---

## 2. Supabase Row-Level Security (RLS)
Every table is locked down with strict RLS policies. RLS must **never** be disabled.

### Implementation Checklist
1. Enable RLS on every newly created table:
   ```sql
   ALTER TABLE public.name ENABLE ROW LEVEL SECURITY;
   ```
2. Bind access policy to `auth.uid() = user_id`:
   * Users can only see, write, edit, and delete their own rows.
   * System directories (like `categories` where `user_id IS NULL`) are visible for SELECT but insert/update is prevented.

---

## 3. Data Sanitization & Input Validation
* **Schema Validation:** Every server action, API payload, and form input is parsed using **Zod**.
* **XSS Protection:** Output values in HTML are escaped by default through React's Virtual DOM. If raw markdown or strings must be rendered (e.g. AI chatbot output), it is passed through a sanitizer like `dompurify`.
* **SQL Injection:** Avoid string interpolation in raw SQL queries. Always use parametrized client statements or Postgres RPC/Stored Procedures.

---

## 4. Rate Limiting & Abuse Prevention
* **API Endpoints:** Dynamic endpoints (such as `/api/ocr/parse` and `/api/chat/query`) use middleware-based rate limiting (upstash or memory tokens) to prevent high-frequency billing abuse.
* **Supabase API Constraints:** Supabase limits requests per IP globally.

---

## 5. Storage Security (Receipt Uploads)
* **Bucket Settings:** The storage bucket for receipt images is marked as private.
* **Access Control:** File access is restricted via Supabase Storage policies matching the user ID stored in the file path.
* **Serving Files:** Files are served using temporary pre-signed URLs generated at access time rather than exposing permanent public links.
