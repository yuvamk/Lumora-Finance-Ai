-- 20260806000001_second_brain.sql
-- Create database schema tables for the personal AI second brain features.
 
-- 1. Create public.brain_dumps table
CREATE TABLE public.brain_dumps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'thought', -- 'thought', 'idea', 'dream', 'reflection'
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 
-- 2. Create public.habit_logs table
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logged_date DATE DEFAULT CURRENT_DATE NOT NULL,
  status BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 
-- 3. Create public.core_values table
CREATE TABLE public.core_values (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  values_list JSONB DEFAULT '[]'::JSONB NOT NULL,
  personal_rules JSONB DEFAULT '[]'::JSONB NOT NULL,
  goals JSONB DEFAULT '[]'::JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 
-- 4. Create public.wellbeing_logs table
CREATE TABLE public.wellbeing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
  energy INTEGER NOT NULL CHECK (energy >= 1 AND energy <= 10),
  stress INTEGER NOT NULL CHECK (stress >= 1 AND stress <= 10),
  notes TEXT,
  logged_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 
-- 5. Create public.memory_vault table
CREATE TABLE public.memory_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 
-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.brain_dumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_vault ENABLE ROW LEVEL SECURITY;
 
-- 7. Configure Security Policies
CREATE POLICY "Users can manage their own brain dumps" ON public.brain_dumps
  FOR ALL USING (auth.uid() = user_id);
 
CREATE POLICY "Users can manage their own habit logs" ON public.habit_logs
  FOR ALL USING (auth.uid() = user_id);
 
CREATE POLICY "Users can manage their own core values statements" ON public.core_values
  FOR ALL USING (auth.uid() = user_id);
 
CREATE POLICY "Users can manage their own well-being check-ins" ON public.wellbeing_logs
  FOR ALL USING (auth.uid() = user_id);
 
CREATE POLICY "Users can manage their own memory vault scrapbook" ON public.memory_vault
  FOR ALL USING (auth.uid() = user_id);
 
-- 8. Add index helpers
CREATE INDEX brain_dumps_user_id_idx ON public.brain_dumps(user_id);
CREATE INDEX habit_logs_user_id_idx ON public.habit_logs(user_id);
CREATE INDEX wellbeing_logs_user_id_idx ON public.wellbeing_logs(user_id);
CREATE INDEX memory_vault_user_id_idx ON public.memory_vault(user_id);
