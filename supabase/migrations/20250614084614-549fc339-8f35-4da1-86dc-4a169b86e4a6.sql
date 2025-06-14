
-- 1) Adicionar o estágio 'aguardando_inicio' se ainda não existir
INSERT INTO leads (id, name, phone, company, niche, responsible_id, pipeline_stage, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Lead Temporário - NÃO USAR',
  '000000000',
  'Empresa Temporária',
  'Geral',
  (SELECT id FROM profiles LIMIT 1),
  'aguardando_inicio',
  'novo',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE pipeline_stage = 'aguardando_inicio');

-- 2) Corrigir todos os leads com estágio inexistente para o estágio inicial correto
UPDATE leads
SET pipeline_stage = 
  CASE 
    WHEN EXISTS (SELECT 1 FROM leads WHERE pipeline_stage = 'aguardando_inicio')
      THEN 'aguardando_inicio'
    ELSE 'prospeccao'
  END
WHERE
  pipeline_stage IS NULL
  OR pipeline_stage = ''
  OR pipeline_stage NOT IN (
    'aguardando_inicio', 'prospeccao', 'reuniao', 'contrato_assinado', 'qualificacao', 'proposta', 'negociacao', 'fechamento'
  );

-- 3) (Opcional) Veja a contagem por estágio para conferência
-- SELECT pipeline_stage, COUNT(*) FROM leads GROUP BY pipeline_stage;

