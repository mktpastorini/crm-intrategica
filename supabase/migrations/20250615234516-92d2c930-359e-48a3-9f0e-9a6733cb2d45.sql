
-- Criar tabela para produtos e serviços
CREATE TABLE public.products_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product', 'service')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para propostas
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de relacionamento entre propostas e produtos/serviços
CREATE TABLE public.proposal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  product_service_id UUID REFERENCES public.products_services(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar coluna proposal_id na tabela leads para vincular proposta ao lead
ALTER TABLE public.leads ADD COLUMN proposal_id UUID REFERENCES public.proposals(id);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para products_services
CREATE POLICY "Users can view all products and services" 
  ON public.products_services 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create products and services" 
  ON public.products_services 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update products and services" 
  ON public.products_services 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete products and services" 
  ON public.products_services 
  FOR DELETE 
  USING (true);

-- Políticas RLS para proposals
CREATE POLICY "Users can view all proposals" 
  ON public.proposals 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create proposals" 
  ON public.proposals 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update proposals" 
  ON public.proposals 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete proposals" 
  ON public.proposals 
  FOR DELETE 
  USING (true);

-- Políticas RLS para proposal_items
CREATE POLICY "Users can view all proposal items" 
  ON public.proposal_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create proposal items" 
  ON public.proposal_items 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update proposal items" 
  ON public.proposal_items 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Users can delete proposal items" 
  ON public.proposal_items 
  FOR DELETE 
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_services_updated_at BEFORE UPDATE ON public.products_services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
