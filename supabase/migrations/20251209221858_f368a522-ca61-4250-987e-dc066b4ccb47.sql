-- Create policies table to store saved quotes
CREATE TABLE public.policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Policy data
  insured_name TEXT,
  mailing_address TEXT,
  occupancy_type TEXT,
  policy_limit BIGINT,
  deductible BIGINT,
  inception_date DATE,
  expiry_date DATE,
  prior_losses BOOLEAN DEFAULT false,
  prior_loss_details TEXT,
  number_of_employees TEXT,
  annual_revenue BIGINT,
  confirmed BOOLEAN DEFAULT false,
  manual_referral BOOLEAN DEFAULT false,
  referral_reason TEXT,
  
  -- Locations stored as JSON
  locations JSONB DEFAULT '[]'::jsonb,
  
  -- Premium calculation
  estimated_premium BIGINT,
  referral_required BOOLEAN DEFAULT false,
  referral_reasons TEXT[]
);

-- Enable Row Level Security (public access for now since no auth)
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- Create a public policy for all operations (since we don't have auth yet)
CREATE POLICY "Allow all operations on policies" 
ON public.policies 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_policies_updated_at
BEFORE UPDATE ON public.policies
FOR EACH ROW
EXECUTE FUNCTION public.update_policies_updated_at();