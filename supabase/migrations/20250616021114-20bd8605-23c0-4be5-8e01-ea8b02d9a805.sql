
-- Atualizar a tabela products_services para ter os campos corretos
ALTER TABLE products_services 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Atualizar a tabela proposals para ter os campos necessários
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Adicionar a coluna proposal_id na tabela leads se não existir
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_proposal_id ON leads(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);

-- Atualizar triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at 
    BEFORE UPDATE ON proposals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_services_updated_at ON products_services;
CREATE TRIGGER update_products_services_updated_at 
    BEFORE UPDATE ON products_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
