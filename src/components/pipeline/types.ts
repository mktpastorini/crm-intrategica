
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
  proposal_id?: string; // Add proposal_id as optional property
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  description?: string;
  order?: number;
}
