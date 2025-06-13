
-- Adicionar campos para webhook de relatório diário
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS report_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS report_webhook_time TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS report_webhook_enabled BOOLEAN DEFAULT false;

-- Criar tabela para rastrear atividades diárias
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  leads_added INTEGER DEFAULT 0,
  leads_moved JSONB DEFAULT '{}',
  messages_sent INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice único por data
CREATE UNIQUE INDEX IF NOT EXISTS daily_activities_date_idx ON public.daily_activities(date);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_daily_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_activities_updated_at_trigger ON public.daily_activities;
CREATE TRIGGER update_daily_activities_updated_at_trigger
    BEFORE UPDATE ON public.daily_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_activities_updated_at();
