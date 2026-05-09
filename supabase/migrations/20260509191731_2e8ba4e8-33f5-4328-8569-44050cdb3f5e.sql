
-- Add user_id ownership to policies
ALTER TABLE public.policies ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON public.policies(user_id);

-- Drop existing permissive authenticated policies
DROP POLICY IF EXISTS "Authenticated users can view policies" ON public.policies;
DROP POLICY IF EXISTS "Authenticated users can insert policies" ON public.policies;
DROP POLICY IF EXISTS "Authenticated users can update policies" ON public.policies;
DROP POLICY IF EXISTS "Authenticated users can delete policies" ON public.policies;

-- User-scoped policies
CREATE POLICY "Users can view own policies"
  ON public.policies FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own policies"
  ON public.policies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own policies"
  ON public.policies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own policies"
  ON public.policies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
