
export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  niche: string;
  responsible_id: string;
  created_at: string;
  pipeline_stage: string; // required everywhere
  proposal_id?: string; // Nova propriedade
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  description?: string;
  order?: number;
}
