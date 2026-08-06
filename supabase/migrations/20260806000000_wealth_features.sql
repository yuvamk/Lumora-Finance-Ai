-- 20260806000000_wealth_features.sql
-- Create database schema tables for manual wealth engine and simulated sandbox features.
 
-- 1. Create public.wealth_assets table
CREATE TABLE public.wealth_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- e.g., 'equity', 'gold', 'cash', 'fixed_income', 'crypto'
  current_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  target_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);
 
-- 2. Create public.wealth_debts table
CREATE TABLE public.wealth_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  debt_name TEXT NOT NULL,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  min_payment NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);
 
-- 3. Create public.wealth_fire_settings table
CREATE TABLE public.wealth_fire_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_retirement_age INTEGER NOT NULL DEFAULT 60,
  expected_return_rate NUMERIC(5, 2) NOT NULL DEFAULT 8.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 
-- 4. Create public.wealth_paper_portfolio table
CREATE TABLE public.wealth_paper_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
  purchase_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 
-- 5. Create public.wealth_paper_balance table
CREATE TABLE public.wealth_paper_balance (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  cash_balance NUMERIC(15, 2) NOT NULL DEFAULT 1000000.00, -- Starts with ₹10,00,000 virtual cash
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 
-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.wealth_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_fire_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_paper_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_paper_balance ENABLE ROW LEVEL SECURITY;
 
-- 7. Configure Security Policies
CREATE POLICY "Users can manage their own assets" ON public.wealth_assets
  FOR ALL USING (auth.uid() = user_id);
 
CREATE POLICY "Users can manage their own debts" ON public.wealth_debts
  FOR ALL USING (auth.uid() = user_id);
 
CREATE POLICY "Users can manage their own FIRE parameters" ON public.wealth_fire_settings
  FOR ALL USING (auth.uid() = user_id);
 
CREATE POLICY "Users can manage their own paper portfolio shares" ON public.wealth_paper_portfolio
  FOR ALL USING (auth.uid() = user_id);
 
CREATE POLICY "Users can manage their own paper trading balance" ON public.wealth_paper_balance
  FOR ALL USING (auth.uid() = user_id);
 
-- 8. Add index helpers
CREATE INDEX wealth_assets_user_id_idx ON public.wealth_assets(user_id);
CREATE INDEX wealth_debts_user_id_idx ON public.wealth_debts(user_id);
CREATE INDEX wealth_paper_portfolio_user_id_idx ON public.wealth_paper_portfolio(user_id);
