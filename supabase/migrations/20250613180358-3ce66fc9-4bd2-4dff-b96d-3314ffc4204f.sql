
-- Adicionar campo para marcar eventos como realizados
ALTER TABLE public.events 
ADD COLUMN completed BOOLEAN DEFAULT FALSE;

-- Adicionar índice para consultas de performance
CREATE INDEX idx_events_completed_date ON public.events(completed, date);
CREATE INDEX idx_events_responsible_completed ON public.events(responsible_id, completed);
