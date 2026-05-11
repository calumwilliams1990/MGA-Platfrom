
CREATE TABLE public.login_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  company text,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request
CREATE POLICY "Anyone can submit a login request"
ON public.login_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read / update / delete
CREATE POLICY "Admins can view login requests"
ON public.login_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update login requests"
ON public.login_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete login requests"
ON public.login_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_login_requests_updated_at
BEFORE UPDATE ON public.login_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_policies_updated_at();
