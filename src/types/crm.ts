
export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  niche: string;
  status: string;
  responsible_id: string;
  responsible?: {
    name: string;
    email: string;
  };
  createdAt: string;
  pipelineStage?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface Event {
  id: string;
  title: string;
  leadName?: string;
  company?: string;
  date: string;
  time: string;
  responsible_id: string;
  responsible?: {
    name: string;
    email: string;
  };
  type: 'reunion' | 'call' | 'whatsapp' | 'email';
  leadId?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'comercial';
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
}

export interface PendingAction {
  id: string;
  type: 'edit_lead' | 'delete_lead' | 'edit_event' | 'delete_event';
  user: string;
  description: string;
  timestamp: string;
  data: any;
  details: any;
}
