CREATE TABLE public.oracle_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  credits integer not null default 1,
  last_weekly_grant date not null default CURRENT_DATE,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.oracle_credits TO authenticated;
GRANT ALL ON public.oracle_credits TO service_role;
ALTER TABLE public.oracle_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own oracle credits" ON public.oracle_credits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);