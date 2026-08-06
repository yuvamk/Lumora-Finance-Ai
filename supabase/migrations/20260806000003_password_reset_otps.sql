-- Migration: Create password_reset_otps table for stateless serverless-friendly forgot password verification
-- Applied Date: 2026-08-06

CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  email TEXT PRIMARY KEY,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Lock it down securely.
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;
