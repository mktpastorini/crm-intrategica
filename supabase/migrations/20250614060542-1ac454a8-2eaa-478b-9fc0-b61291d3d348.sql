
-- Criar tabela para armazenar as ações pendentes de aprovação
CREATE TABLE public.pending_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

-- Política para usuários comerciais verem apenas suas próprias solicitações
CREATE POLICY "Users can view their own pending approvals" 
  ON public.pending_approvals 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários comerciais criarem suas próprias solicitações
CREATE POLICY "Users can create their own pending approvals" 
  ON public.pending_approvals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para supervisores e admins verem todas as solicitações pendentes
CREATE POLICY "Supervisors and admins can view all pending approvals" 
  ON public.pending_approvals 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );

-- Política para supervisores e admins atualizarem solicitações
CREATE POLICY "Supervisors and admins can update pending approvals" 
  ON public.pending_approvals 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('supervisor', 'admin')
    )
  );
