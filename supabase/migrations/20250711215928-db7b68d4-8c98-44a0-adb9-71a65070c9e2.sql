
-- Criar tabela para contatos adicionais dos leads
CREATE TABLE public.lead_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;

-- Política para visualizar contatos dos leads
CREATE POLICY "Users can view lead contacts" 
  ON public.lead_contacts 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_contacts.lead_id 
      AND (leads.responsible_id = auth.uid() OR get_current_user_role() = ANY(ARRAY['admin', 'supervisor']))
    )
  );

-- Política para criar contatos dos leads
CREATE POLICY "Users can create lead contacts" 
  ON public.lead_contacts 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_contacts.lead_id 
      AND (leads.responsible_id = auth.uid() OR get_current_user_role() = ANY(ARRAY['admin', 'supervisor']))
    )
  );

-- Política para atualizar contatos dos leads
CREATE POLICY "Users can update lead contacts" 
  ON public.lead_contacts 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_contacts.lead_id 
      AND (leads.responsible_id = auth.uid() OR get_current_user_role() = ANY(ARRAY['admin', 'supervisor']))
    )
  );

-- Política para excluir contatos dos leads
CREATE POLICY "Users can delete lead contacts" 
  ON public.lead_contacts 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.leads 
      WHERE leads.id = lead_contacts.lead_id 
      AND (leads.responsible_id = auth.uid() OR get_current_user_role() = ANY(ARRAY['admin', 'supervisor']))
    )
  );
