
-- Cria tabela para agendamento das mensagens de jornada do cliente
CREATE TABLE public.journey_message_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  stage TEXT NOT NULL,
  message_title TEXT,
  message_content TEXT,
  message_type TEXT,
  media_url TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: só pode ler/escrever se autenticado (ajuste conforme regra do seu projeto)
ALTER TABLE public.journey_message_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura a todos autenticados"
  ON public.journey_message_schedules
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir insert a todos autenticados"
  ON public.journey_message_schedules
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir update a todos autenticados"
  ON public.journey_message_schedules
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir delete a todos autenticados"
  ON public.journey_message_schedules
  FOR DELETE
  USING (auth.role() = 'authenticated');
