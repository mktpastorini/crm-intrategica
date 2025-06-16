
import { supabase } from "@/integrations/supabase/client";
import { createJourneySchedule } from "./journeyScheduleService";

export interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  pipeline_stage: string;
}

export interface JourneyMessage {
  id: string;
  title: string;
  content: string;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  stage: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  order: number;
}

async function getSystemSettings() {
  const { data } = await supabase
    .from('system_settings')
    .select('journey_webhook_url')
    .limit(1)
    .maybeSingle();
  
  return data;
}

function calculateScheduledTime(delay: number, unit: 'minutes' | 'hours' | 'days'): string {
  const now = new Date();
  
  switch (unit) {
    case 'minutes':
      now.setMinutes(now.getMinutes() + delay);
      break;
    case 'hours':
      now.setHours(now.getHours() + delay);
      break;
    case 'days':
      now.setDate(now.getDate() + delay);
      break;
  }
  
  return now.toISOString();
}

export async function triggerJourneyMessages(lead: Lead, newStage: string) {
  console.log('[Journey] Verificando mensagens para lead:', lead.name, 'no estágio:', newStage);
  
  try {
    // Buscar configurações do sistema
    const settings = await getSystemSettings();
    if (!settings?.journey_webhook_url) {
      console.log('[Journey] Webhook da jornada não configurado');
      return;
    }

    // Buscar mensagens configuradas para este estágio
    const savedMessages = localStorage.getItem('journeyMessages');
    if (!savedMessages) {
      console.log('[Journey] Nenhuma mensagem configurada');
      return;
    }

    const messages: JourneyMessage[] = JSON.parse(savedMessages);
    const stageMessages = messages.filter(m => m.stage === newStage);

    console.log(`[Journey] Encontradas ${stageMessages.length} mensagens para o estágio ${newStage}`);

    // Criar agendamentos para cada mensagem
    for (const message of stageMessages) {
      const scheduledFor = calculateScheduledTime(message.delay, message.delayUnit);
      
      console.log(`[Journey] Agendando mensagem "${message.title}" para ${scheduledFor}`);
      
      await createJourneySchedule({
        lead_id: lead.id,
        lead_name: lead.name,
        lead_phone: lead.phone,
        lead_email: lead.email,
        stage: newStage,
        message_title: message.title,
        message_content: message.content,
        message_type: message.type,
        media_url: message.mediaUrl,
        scheduled_for: scheduledFor,
        webhook_url: settings.journey_webhook_url
      });
    }

    console.log(`[Journey] ${stageMessages.length} mensagens agendadas com sucesso`);
  } catch (error) {
    console.error('[Journey] Erro ao agendar mensagens:', error);
  }
}
