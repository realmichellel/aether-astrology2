CREATE TABLE public.processed_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  price_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.processed_payments TO authenticated;
GRANT ALL ON public.processed_payments TO service_role;
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own processed payments" ON public.processed_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own processed payments" ON public.processed_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);