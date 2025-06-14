
-- Cria tabela de histórico de mensagens enviadas pela jornada do cliente
CREATE TABLE public.journey_message_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.journey_message_schedules(id),
  lead_id UUID,
  lead_name TEXT,
  lead_phone TEXT,
  lead_email TEXT,
  stage TEXT,
  message_title TEXT,
  message_content TEXT,
  message_type TEXT,
  media_url TEXT,
  webhook_url TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journey_message_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura a todos autenticados"
  ON public.journey_message_history
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir insert a todos autenticados"
  ON public.journey_message_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
