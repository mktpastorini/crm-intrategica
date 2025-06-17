
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Buscar configurações do sistema
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (!settings?.report_webhook_enabled || !settings?.report_webhook_url) {
      console.log('Webhook do relatório não está habilitado ou configurado');
      return new Response(
        JSON.stringify({ message: 'Webhook do relatório não está habilitado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é o horário correto para enviar o relatório
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    const scheduledTime = settings.report_webhook_time || '18:00';

    console.log(`Horário atual: ${currentTime}, Horário agendado: ${scheduledTime}`);

    // Permitir uma margem de 5 minutos para execução
    const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
    const scheduledMinutes = parseInt(scheduledTime.split(':')[0]) * 60 + parseInt(scheduledTime.split(':')[1]);
    const timeDiff = Math.abs(currentMinutes - scheduledMinutes);

    if (timeDiff > 5) {
      console.log(`Não é o horário para enviar o relatório. Diferença: ${timeDiff} minutos`);
      return new Response(
        JSON.stringify({ message: 'Não é o horário para enviar o relatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chamar a função de geração de relatório
    const generateReportUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-daily-report`;
    
    console.log('Chamando função de geração de relatório...');
    
    const response = await fetch(generateReportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ 
        date: now.toISOString().split('T')[0],
        triggered_by: 'cron_job'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao chamar generate-daily-report:', response.status, errorText);
      throw new Error(`Erro ao gerar relatório: ${response.status}`);
    }

    const result = await response.json();
    console.log('Relatório gerado e enviado com sucesso:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Relatório diário enviado com sucesso',
        timestamp: new Date().toISOString(),
        report_data: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook do relatório diário:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
