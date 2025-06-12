
-- Adicionar campos para dados do Google Maps na tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Criar índice para place_id para evitar duplicatas
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON public.leads(place_id);
