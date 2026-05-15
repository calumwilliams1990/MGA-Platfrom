-- Tighten policies RLS: users can only access their own; admins see all
DROP POLICY IF EXISTS "Dev: anyone can delete policies" ON public.policies;
DROP POLICY IF EXISTS "Dev: anyone can insert policies" ON public.policies;
DROP POLICY IF EXISTS "Dev: anyone can update policies" ON public.policies;
DROP POLICY IF EXISTS "Dev: anyone can view policies" ON public.policies;

CREATE POLICY "Users can view own policies" ON public.policies
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own policies" ON public.policies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own policies" ON public.policies
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own policies" ON public.policies
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_policies_updated_at ON public.policies;
CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_policies_updated_at();