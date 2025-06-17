
-- Habilita as extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cria um cron job que executa a cada 5 minutos para verificar e enviar mensagens agendadas
SELECT cron.schedule(
  'journey-message-dispatcher-cron',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT
    net.http_post(
        url:='https://gfuoipqwmhfrqhmkqyxp.supabase.co/functions/v1/journey-message-dispatcher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdW9pcHF3bWhmcnFobWtxeXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTYzNzEsImV4cCI6MjA2NDU3MjM3MX0.Y4GnTkvLF-tLDqJX7jZosouYYDESs7n2oV6XUseJV7w"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);
