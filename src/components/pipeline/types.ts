
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
  status?: string; // Added status property
  proposal_id?: string; // Added proposal_id property
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  description?: string;
  order?: number;
}
