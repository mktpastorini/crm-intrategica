
import { supabase } from "@/integrations/supabase/client";

export interface JourneyScheduleCreateInput {
  lead_id: string;
  lead_name?: string;
  lead_phone?: string;
  lead_email?: string;
  stage: string;
  message_title?: string;
  message_content?: string;
  message_type?: string;
  media_url?: string;
  scheduled_for: string;
  webhook_url?: string;
}

export async function createJourneySchedule(input: JourneyScheduleCreateInput) {
  const { data, error } = await supabase
    .from("journey_message_schedules")
    .insert([input])
    .select()
    .single();

  if (error) throw error;
  return data;
}
