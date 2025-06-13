
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemSettingsDB } from './useSystemSettingsDB';

export function useDailyReportScheduler() {
  const { settings } = useSystemSettingsDB();

  useEffect(() => {
    if (!settings.reportWebhookEnabled || !settings.reportWebhookUrl) {
      return;
    }

    // Função para verificar se é hora de gerar o relatório
    const checkReportTime = () => {
      const now = new Date();
      const reportTime = settings.reportWebhookTime || '18:00';
      const [reportHour, reportMinute] = reportTime.split(':').map(Number);
      
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Verifica se é exatamente o horário do relatório (com margem de 1 minuto)
      if (currentHour === reportHour && currentMinute === reportMinute) {
        console.log('Horário do relatório detectado, gerando relatório...');
        generateDailyReport();
      }
    };

    // Verifica a cada minuto
    const interval = setInterval(checkReportTime, 60000);

    return () => clearInterval(interval);
  }, [settings.reportWebhookEnabled, settings.reportWebhookUrl, settings.reportWebhookTime]);

  const generateDailyReport = async () => {
    try {
      console.log('Chamando função de geração de relatório diário...');
      
      const { data, error } = await supabase.functions.invoke('generate-daily-report');
      
      if (error) {
        console.error('Erro ao gerar relatório diário:', error);
      } else {
        console.log('Relatório diário gerado com sucesso:', data);
      }
    } catch (error) {
      console.error('Erro ao chamar função de relatório:', error);
    }
  };

  return { generateDailyReport };
}
