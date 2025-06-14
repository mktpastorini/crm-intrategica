
-- Garante que todos os estágios necessários existem no pipeline (ajuste os nomes/ids conforme seu sistema se usar outros valores!)
-- Adicione o estágio 'prospeccao' caso não exista
INSERT INTO leads (id, name, phone, company, niche, responsible_id, pipeline_stage, status, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'Lead Temporário - NÃO USAR',
  '000000000',
  'Empresa Temporária',
  'Geral',
  (SELECT id FROM profiles LIMIT 1),
  'prospeccao',
  'novo',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE pipeline_stage = 'prospeccao');

-- Corrige todos os leads sem estágio ou com estágio inválido para 'prospeccao'
UPDATE leads
SET pipeline_stage = 'prospeccao'
WHERE
  pipeline_stage IS NULL
  OR pipeline_stage = ''
  OR pipeline_stage NOT IN (
    'prospeccao', 'reuniao', 'contrato_assinado', 'qualificacao', 'proposta', 'negociacao', 'fechamento'
  );

-- PARA VERIFICAR (opcional): Veja a contagem por estágio após corrigir
-- SELECT pipeline_stage, COUNT(*) FROM leads GROUP BY pipeline_stage;

