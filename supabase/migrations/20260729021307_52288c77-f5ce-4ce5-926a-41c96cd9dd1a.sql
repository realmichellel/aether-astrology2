CREATE TABLE public.synastry_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_name text NOT NULL,
  partner_birth_date date NOT NULL,
  partner_birth_time time,
  partner_birth_place text NOT NULL,
  person1 jsonb NOT NULL,
  person2 jsonb NOT NULL,
  report jsonb NOT NULL,
  unlocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.synastry_reports TO authenticated;
GRANT ALL ON public.synastry_reports TO service_role;
ALTER TABLE public.synastry_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own synastry" ON public.synastry_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);