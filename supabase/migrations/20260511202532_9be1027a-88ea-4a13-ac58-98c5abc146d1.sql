
DROP POLICY IF EXISTS "Users can view own policies" ON public.policies;
DROP POLICY IF EXISTS "Users can insert own policies" ON public.policies;
DROP POLICY IF EXISTS "Users can update own policies" ON public.policies;
DROP POLICY IF EXISTS "Users can delete own policies" ON public.policies;

CREATE POLICY "Dev: anyone can view policies" ON public.policies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Dev: anyone can insert policies" ON public.policies FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Dev: anyone can update policies" ON public.policies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Dev: anyone can delete policies" ON public.policies FOR DELETE TO anon, authenticated USING (true);
