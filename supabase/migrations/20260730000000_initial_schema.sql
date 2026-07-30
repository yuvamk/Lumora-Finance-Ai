-- Initial database schema setup for Lumora AI
-- Applied Date: 2026-07-30

-- ============================================================================
-- 1. Create custom PostgreSQL ENUM types
-- ============================================================================

CREATE TYPE public.transaction_type AS ENUM ('income', 'expense', 'transfer', 'refund');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE public.budget_period AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE public.notification_type AS ENUM ('budget', 'goal', 'subscription', 'system', 'ai');
CREATE TYPE public.activity_action AS ENUM (
  'login', 
  'logout', 
  'transaction_created', 
  'transaction_updated', 
  'transaction_deleted', 
  'goal_created', 
  'budget_updated', 
  'ai_report_generated', 
  'settings_changed'
);

-- ============================================================================
-- 2. Create Base Trigger functions
-- ============================================================================

-- A trigger to automatically sync profiles when new users sign up via auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  -- Create default settings for the user
  INSERT INTO public.settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- A trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. Create tables with UUIDs and audit columns
-- ============================================================================

-- profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY, -- matches auth.users UUID
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- settings table
CREATE TABLE public.settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'system' NOT NULL,
  base_currency_code VARCHAR(3) DEFAULT 'USD' NOT NULL,
  base_currency_symbol VARCHAR(5) DEFAULT '$' NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL indicates system default
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  icon TEXT,
  color VARCHAR(10),
  sort_order INT DEFAULT 0 NOT NULL,
  is_default BOOLEAN DEFAULT false NOT NULL,
  is_system BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  UNIQUE (user_id, name, type)
);

-- subcategories table
CREATE TABLE public.subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL indicates system default
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  UNIQUE (category_id, user_id, name)
);

-- merchants table
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  UNIQUE (user_id, name)
);

-- payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g., 'cash', 'credit_card', 'bank_account'
  last_four VARCHAR(4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- receipts table
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  raw_ocr_data JSONB,
  merchant_name TEXT,
  total_amount NUMERIC(12, 2),
  tax_amount NUMERIC(12, 2),
  date DATE,
  status public.transaction_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- budgets table
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL,
  period public.budget_period DEFAULT 'monthly' NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- budget_history table
CREATE TABLE public.budget_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  limit_amount NUMERIC(12, 2) NOT NULL,
  spent_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  target_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL, -- e.g., 'emergency_fund', 'vacation'
  current_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- goal_progress table
CREATE TABLE public.goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type public.transaction_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency_code VARCHAR(3) DEFAULT 'USD' NOT NULL,
  currency_symbol VARCHAR(5) DEFAULT '$' NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
  subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
  budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
  parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE, -- self-reference for splits
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  time TIME,
  notes TEXT,
  mood VARCHAR(20) CHECK (mood IN ('happy', 'stressed', 'neutral', 'regretful', 'necessary')),
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'ocr', 'api')),
  is_recurring BOOLEAN DEFAULT false NOT NULL,
  recurring_rule TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
  attachments TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  UNIQUE (user_id, name)
);

-- transaction_tags table
CREATE TABLE public.transaction_tags (
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (transaction_id, tag_id)
);

-- subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  billing_period public.budget_period DEFAULT 'monthly' NOT NULL,
  start_date DATE NOT NULL,
  next_billing_date DATE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- chat_history table
CREATE TABLE public.chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID NOT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
  message TEXT NOT NULL,
  tokens INT,
  model VARCHAR(50),
  latency INT, -- in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- ai_reports table
CREATE TABLE public.ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  report_type VARCHAR(20) CHECK (report_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')) NOT NULL,
  summary TEXT,
  insights_json JSONB DEFAULT '{}'::jsonb NOT NULL,
  recommendations_json JSONB DEFAULT '{}'::jsonb NOT NULL,
  analytics_snapshot JSONB DEFAULT '{}'::jsonb NOT NULL,
  model_name VARCHAR(50) NOT NULL,
  prompt_version VARCHAR(20) NOT NULL,
  token_usage INT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- predictions table
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_date DATE NOT NULL,
  prediction_type VARCHAR(20) NOT NULL, -- e.g., 'expense', 'income'
  confidence_score NUMERIC(5, 2) NOT NULL, -- percentage e.g. 85.50
  input_snapshot JSONB DEFAULT '{}'::jsonb NOT NULL,
  forecast_json JSONB DEFAULT '{}'::jsonb NOT NULL,
  model_version VARCHAR(20) NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action public.activity_action NOT NULL,
  entity VARCHAR(50) NOT NULL, -- e.g., 'transactions', 'settings'
  entity_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID
);

-- ============================================================================
-- 4. Apply Timestamp Triggers
-- ============================================================================

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_settings_modtime BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_subcategories_modtime BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_merchants_modtime BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_payment_methods_modtime BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_receipts_modtime BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_budgets_modtime BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_budget_history_modtime BEFORE UPDATE ON public.budget_history FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_goals_modtime BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_goal_progress_modtime BEFORE UPDATE ON public.goal_progress FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_tags_modtime BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_modtime BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_notifications_modtime BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_chat_history_modtime BEFORE UPDATE ON public.chat_history FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_ai_reports_modtime BEFORE UPDATE ON public.ai_reports FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_predictions_modtime BEFORE UPDATE ON public.predictions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_activity_logs_modtime BEFORE UPDATE ON public.activity_logs FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Enable User Registration Auto-sync Profile
-- Note: This trigger must be set up on the auth.users table inside Supabase database
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 5. Row-Level Security (RLS) policies - Default Deny
-- ============================================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow users to update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

-- Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to select categories" ON public.categories FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow users to insert categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Subcategories
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to select subcategories" ON public.subcategories FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow users to insert subcategories" ON public.subcategories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update subcategories" ON public.subcategories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete subcategories" ON public.subcategories FOR DELETE USING (auth.uid() = user_id);

-- Merchants
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to select merchants" ON public.merchants FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Allow users to insert merchants" ON public.merchants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update merchants" ON public.merchants FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to delete merchants" ON public.merchants FOR DELETE USING (auth.uid() = user_id);

-- Payment Methods
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own payment methods" ON public.payment_methods FOR ALL USING (auth.uid() = user_id);

-- Receipts
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own receipts" ON public.receipts FOR ALL USING (auth.uid() = user_id);

-- Budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Budget History
ALTER TABLE public.budget_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to select own budget history" ON public.budget_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.budgets WHERE id = budget_id AND user_id = auth.uid())
);

-- Goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- Goal Progress
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own goal progress" ON public.goal_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM public.goals WHERE id = goal_id AND user_id = auth.uid())
);

-- Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own tags" ON public.tags FOR ALL USING (auth.uid() = user_id);

-- Transaction Tags
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own transaction tags" ON public.transaction_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.transactions WHERE id = transaction_id AND user_id = auth.uid())
);

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own subscriptions" ON public.subscriptions FOR ALL USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Chat History
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own chat history" ON public.chat_history FOR ALL USING (auth.uid() = user_id);

-- AI Reports
ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own AI reports" ON public.ai_reports FOR ALL USING (auth.uid() = user_id);

-- Predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own predictions" ON public.predictions FOR ALL USING (auth.uid() = user_id);

-- Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to select own activity logs" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow system to insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. Performance Indexing Strategy
-- ============================================================================

-- Index reason: Speed up core ledger queries ordered by date
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC) WHERE deleted_at IS NULL;
-- Index reason: Category groupings analysis queries
CREATE INDEX idx_transactions_user_category ON public.transactions(user_id, category_id) WHERE deleted_at IS NULL;
-- Index reason: Auditing activity timestamps
CREATE INDEX idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);
-- Index reason: Detecting active subscription renewal timelines
CREATE INDEX idx_subscriptions_user_next_bill ON public.subscriptions(user_id, next_billing_date) WHERE status = 'active' AND deleted_at IS NULL;
-- Index reason: Finding split sub-transactions
CREATE INDEX idx_transactions_parent ON public.transactions(parent_transaction_id) WHERE parent_transaction_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================================
-- 7. Seed Default Categories (System Level)
-- ============================================================================

INSERT INTO public.categories (name, type, icon, color, sort_order, is_system, is_default) VALUES
('Housing & Rent', 'expense', 'home', '#f43f5e', 1, true, true),
('Food & Dining', 'expense', 'utensils', '#f97316', 2, true, true),
('Transportation', 'expense', 'car', '#eab308', 3, true, true),
('Utilities', 'expense', 'zap', '#06b6d4', 4, true, true),
('Insurance & Health', 'expense', 'heart-pulse', '#3b82f6', 5, true, true),
('Entertainment & Leisure', 'expense', 'clapperboard', '#a855f7', 6, true, true),
('Shopping', 'expense', 'shopping-bag', '#ec4899', 7, true, true),
('Subscriptions', 'expense', 'credit-card', '#6366f1', 8, true, true),
('Salary', 'income', 'briefcase', '#10b981', 9, true, true),
('Investments', 'income', 'trending-up', '#14b8a6', 10, true, true),
('Gifts & Refunds', 'income', 'gift', '#84cc16', 11, true, true),
('Internal Transfer', 'transfer', 'arrow-left-right', '#6b7280', 12, true, true);
