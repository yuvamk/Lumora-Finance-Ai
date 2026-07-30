-- Add onboarding tracking columns to profiles
-- Applied Date: 2026-07-30

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0 NOT NULL;

-- Index for fast onboarding state check
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(id, onboarding_completed);
