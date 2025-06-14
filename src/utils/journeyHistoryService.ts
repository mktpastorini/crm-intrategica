
import { supabase } from "@/integrations/supabase/client";

export interface JourneyMessageHistory {
  id: string;
  schedule_id?: string;
  lead_id?: string;
  lead_name?: string;
  lead_phone?: string;
  lead_email?: string;
  stage?: string;
  message_title?: string;
  message_content?: string;
  message_type?: string;
  media_url?: string;
  webhook_url?: string;
  sent_at: string;
}

export async function fetchJourneyHistory(limit = 30): Promise<JourneyMessageHistory[]> {
  const { data, error } = await supabase
    .from("journey_message_history")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as JourneyMessageHistory[];
}
