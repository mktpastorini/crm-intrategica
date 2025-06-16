
export interface Event {
  id: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  lead_id?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  type: string;
  date: string;
  time: string;
  company?: string;
  lead_name?: string;
  responsible_id: string;
  completed?: boolean;
}
