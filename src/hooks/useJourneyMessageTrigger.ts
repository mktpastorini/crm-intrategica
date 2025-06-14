
import { useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useSystemSettingsDB } from './useSystemSettingsDB';

interface JourneyMessage {
  id: string;
  title: string;
  content: string;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  stage: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  order: number;
  created_at: string;
}

export const useJourneyMessageTrigger = () => {
  const { leads } = useCrm();
  const { settings } = useSystemSettingsDB();

  const scheduleJourneyMessage = async (leadId: string, message: JourneyMessage, leadData: any) => {
    if (!settings.journeyWebhookUrl) return;

    // Calcular delay em milissegundos
    let delayMs = 0;
    switch (message.delayUnit) {
      case 'minutes':
        delayMs = message.delay * 60 * 1000;
        break;
      case 'hours':
        delayMs = message.delay * 60 * 60 * 1000;
        break;
      case 'days':
        delayMs = message.delay * 24 * 60 * 60 * 1000;
        break;
    }

    // Agendar o envio da mensagem
    setTimeout(async () => {
      try {
        const webhookPayload = {
          leadId,
          leadName: leadData.name,
          leadPhone: leadData.phone,
          leadEmail: leadData.email,
          message: {
            title: message.title,
            content: message.content,
            type: message.type,
            mediaUrl: message.mediaUrl
          },
          stage: message.stage,
          timestamp: new Date().toISOString()
        };

        console.log('Enviando mensagem da jornada via webhook:', webhookPayload);

        await fetch(settings.journeyWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log('Mensagem da jornada enviada com sucesso');
      } catch (error) {
        console.error('Erro ao enviar mensagem da jornada:', error);
      }
    }, delayMs);
  };

  const triggerJourneyMessages = (leadId: string, newStage: string, leadData: any) => {
    const savedMessages = localStorage.getItem('journeyMessages');
    if (!savedMessages) return;

    const messages: JourneyMessage[] = JSON.parse(savedMessages);
    const stageMessages = messages
      .filter(m => m.stage === newStage)
      .sort((a, b) => a.order - b.order);

    console.log(`Disparando ${stageMessages.length} mensagens para o lead ${leadId} no estágio ${newStage}`);

    stageMessages.forEach(message => {
      scheduleJourneyMessage(leadId, message, leadData);
    });
  };

  return { triggerJourneyMessages };
};
