-- Add prior_loss_amount column to policies table
ALTER TABLE public.policies 
ADD COLUMN prior_loss_amount bigint DEFAULT NULL;