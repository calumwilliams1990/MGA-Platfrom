-- Allow public insert/update on zip_risk_grades (reference data table)
CREATE POLICY "Allow public insert on zip_risk_grades"
ON public.zip_risk_grades
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on zip_risk_grades"
ON public.zip_risk_grades
FOR UPDATE
USING (true)
WITH CHECK (true);