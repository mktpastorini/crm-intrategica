
export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  niche: string;
  responsible_id: string;
  created_at: string;
  updated_at: string;
  pipeline_stage: string; // required everywhere
  status: string; // Adicionando status que estava faltando
  proposal_id?: string;
  // Campos adicionais do Google Maps
  website?: string;
  address?: string;
  rating?: number;
  place_id?: string;
  whatsapp?: string;
  instagram?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  description?: string;
  order?: number;
}
