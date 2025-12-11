-- Create zip_risk_grades table for storing ZIP code risk data from the rater
CREATE TABLE public.zip_risk_grades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    zip_code text NOT NULL UNIQUE,
    risk_grade text NOT NULL CHECK (risk_grade IN ('A', 'B', 'C', 'D', 'E')),
    state text,
    county text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zip_risk_grades ENABLE ROW LEVEL SECURITY;

-- Allow public read access (risk grades are not sensitive)
CREATE POLICY "Anyone can read zip risk grades"
ON public.zip_risk_grades
FOR SELECT
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_zip_risk_grades_zip_code ON public.zip_risk_grades(zip_code);