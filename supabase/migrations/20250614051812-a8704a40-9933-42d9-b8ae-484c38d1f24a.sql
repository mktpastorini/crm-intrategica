
-- Adicionar coluna pipeline_stage como obrigatória com valor padrão
ALTER TABLE leads ALTER COLUMN pipeline_stage SET DEFAULT 'prospeccao';

-- Atualizar leads existentes que não têm pipeline_stage definido
UPDATE leads 
SET pipeline_stage = 'prospeccao' 
WHERE pipeline_stage IS NULL OR pipeline_stage = '';

-- Adicionar constraint para garantir que pipeline_stage não seja nulo
ALTER TABLE leads ALTER COLUMN pipeline_stage SET NOT NULL;

-- Criar trigger para garantir que novos leads sempre recebam o primeiro estágio
CREATE OR REPLACE FUNCTION set_default_pipeline_stage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pipeline_stage IS NULL OR NEW.pipeline_stage = '' THEN
    NEW.pipeline_stage := 'prospeccao';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger na tabela leads
DROP TRIGGER IF EXISTS trigger_set_default_pipeline_stage ON leads;
CREATE TRIGGER trigger_set_default_pipeline_stage
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_default_pipeline_stage();
