
export interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  company?: string;
  lead_name?: string;
  responsible_id: string;
  lead_id?: string;
  completed?: boolean;
  created_at: string;
}
