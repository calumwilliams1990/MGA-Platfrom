CREATE TABLE public.marine_tow_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  insured_name text,
  vessel_name text,
  estimated_premium bigint,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marine_tow_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own marine tow quotes" ON public.marine_tow_quotes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own marine tow quotes" ON public.marine_tow_quotes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own marine tow quotes" ON public.marine_tow_quotes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete own marine tow quotes" ON public.marine_tow_quotes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_marine_tow_quotes_updated_at
  BEFORE UPDATE ON public.marine_tow_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_policies_updated_at();