
-- Criação da tabela de estágios do pipeline
CREATE TABLE public.pipeline_stages (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#0ea5e9',
  description text,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Permitir leitura de estágios do pipeline" ON public.pipeline_stages
  FOR SELECT
  USING (true);

-- Política para INSERT por usuários autenticados
CREATE POLICY "Permitir insert por usuários autenticados" ON public.pipeline_stages
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE por usuários autenticados
CREATE POLICY "Permitir update por usuários autenticados" ON public.pipeline_stages
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Política para DELETE por usuários autenticados
CREATE POLICY "Permitir delete por usuários autenticados" ON public.pipeline_stages
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Popular inicialmente com os estágios definidos
INSERT INTO public.pipeline_stages (id, name, color, description, "order") VALUES
  ('aguardando_contato', 'Aguardando Contato', '#8b5cf6', 'Leads aguardando o primeiro contato', 1),
  ('reuniao', 'Reunião', '#10b981', 'Reunião marcada/com o lead', 2),
  ('contrato_assinado', 'Contrato Assinado', '#f59e42', 'Lead fechou e assinou o contrato', 3);
