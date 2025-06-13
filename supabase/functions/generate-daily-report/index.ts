
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Iniciando geração do relatório diário...');

    // Buscar configurações do sistema
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!settings?.report_webhook_enabled || !settings?.report_webhook_url) {
      console.log('Relatório diário não está habilitado ou URL não configurada');
      return new Response(
        JSON.stringify({ message: 'Relatório não habilitado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    console.log('Coletando dados do dia:', today);

    // Buscar dados de atividades do dia atual
    const { data: dailyActivity } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    // Se não houver atividades registradas, criar com valores zerados
    const activityData = dailyActivity || {
      leads_added: 0,
      leads_moved: {},
      messages_sent: 0,
      events_created: 0
    };

    // Preparar dados do relatório
    const reportData = {
      date: today,
      summary: {
        leads_added: activityData.leads_added || 0,
        leads_moved: activityData.leads_moved || {},
        messages_sent: activityData.messages_sent || 0,
        events_created: activityData.events_created || 0
      },
      details: {
        total_activities: (activityData.leads_added || 0) + 
                         (activityData.messages_sent || 0) + 
                         (activityData.events_created || 0),
        system_name: settings.system_name || "Sistema CRM",
        generated_at: new Date().toISOString()
      },
      test: false
    };

    console.log('Dados do relatório preparados:', reportData);

    // Enviar para o webhook
    const response = await fetch(settings.report_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-System-Daily-Report/1.0'
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      console.error('Erro ao enviar relatório:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao enviar relatório',
          status: response.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Relatório enviado com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Relatório diário enviado com sucesso',
        data: reportData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar relatório diário:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
