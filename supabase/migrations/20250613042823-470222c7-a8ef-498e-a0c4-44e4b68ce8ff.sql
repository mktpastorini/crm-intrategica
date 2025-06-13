
-- Add the report_whatsapp_number column to system_settings table
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS report_whatsapp_number TEXT;
