-- Lock down policies table: authenticated only
DROP POLICY IF EXISTS "Allow all operations on policies" ON public.policies;

CREATE POLICY "Authenticated users can view policies"
ON public.policies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert policies"
ON public.policies FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update policies"
ON public.policies FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete policies"
ON public.policies FOR DELETE
TO authenticated
USING (true);

-- Lock down zip_risk_grades writes: authenticated only, keep public read
DROP POLICY IF EXISTS "Allow public insert on zip_risk_grades" ON public.zip_risk_grades;
DROP POLICY IF EXISTS "Allow public update on zip_risk_grades" ON public.zip_risk_grades;

CREATE POLICY "Authenticated users can insert zip risk grades"
ON public.zip_risk_grades FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update zip risk grades"
ON public.zip_risk_grades FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);