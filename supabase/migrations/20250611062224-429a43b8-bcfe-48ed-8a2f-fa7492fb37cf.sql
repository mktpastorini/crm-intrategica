
-- Add google_maps_api_key column to system_settings table
ALTER TABLE public.system_settings 
ADD COLUMN google_maps_api_key TEXT;
