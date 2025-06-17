
-- Remove a referência da proposta no lead primeiro
UPDATE leads SET proposal_id = NULL WHERE name ILIKE '%Supermercado Araujo%' OR company ILIKE '%Supermercado Araujo%';

-- Remove os itens das propostas vinculadas ao lead
DELETE FROM proposal_items WHERE proposal_id IN (
  SELECT p.id FROM proposals p 
  JOIN leads l ON p.lead_id = l.id 
  WHERE l.name ILIKE '%Supermercado Araujo%' OR l.company ILIKE '%Supermercado Araujo%'
);

-- Remove as propostas vinculadas ao lead
DELETE FROM proposals WHERE lead_id IN (
  SELECT id FROM leads WHERE name ILIKE '%Supermercado Araujo%' OR company ILIKE '%Supermercado Araujo%'
);

-- Agora remove o lead "Supermercado Araujo" do sistema
DELETE FROM leads WHERE name ILIKE '%Supermercado Araujo%' OR company ILIKE '%Supermercado Araujo%';
