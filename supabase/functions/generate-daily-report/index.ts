
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

    // Pegar a data atual (hoje)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`Gerando relatório para a data: ${todayStr}`);

    // Buscar configurações do sistema
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (!settings?.report_webhook_url) {
      console.log('Webhook do relatório não configurado');
      return new Response(
        JSON.stringify({ error: 'Webhook do relatório não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar atividades do dia atual
    const { data: dailyActivity, error: activityError } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('date', todayStr)
      .single();

    if (activityError && activityError.code !== 'PGRST116') {
      console.error('Erro ao buscar atividades diárias:', activityError);
      throw activityError;
    }

    // Buscar dados atuais do sistema para o relatório
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('date', todayStr);

    const { data: proposals } = await supabase
      .from('proposals')
      .select('*');

    // Calcular estatísticas atuais
    const totalLeads = leads?.length || 0;
    const newLeadsToday = leads?.filter(lead => 
      lead.created_at.startsWith(todayStr)
    ).length || 0;
    
    const eventsToday = events?.length || 0;
    const proposalsTotal = proposals?.length || 0;

    // Contar leads por estágio
    const leadsByStage = leads?.reduce((acc, lead) => {
      acc[lead.pipeline_stage] = (acc[lead.pipeline_stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Calcular leads movidos hoje (do daily_activities se existir)
    const leadsMovedData = dailyActivity?.leads_moved || {};
    const totalLeadsMovedToday = Object.values(leadsMovedData).reduce((sum: number, count: any) => sum + (count || 0), 0);

    // Estruturar dados do relatório
    const reportData = {
      date: todayStr,
      timestamp: new Date().toISOString(),
      summary: {
        total_leads: totalLeads,
        new_leads_today: newLeadsToday,
        leads_moved_today: totalLeadsMovedToday,
        events_today: eventsToday,
        total_proposals: proposalsTotal,
        messages_sent_today: dailyActivity?.messages_sent || 0
      },
      leads_by_stage: leadsByStage,
      recent_activities: {
        leads_moved: leadsMovedData,
        events_created: dailyActivity?.events_created || 0,
        leads_added: dailyActivity?.leads_added || 0
      },
      system_info: {
        report_generated_at: new Date().toISOString(),
        system_name: settings?.system_name || 'CRM System'
      }
    };

    console.log('Dados do relatório:', JSON.stringify(reportData, null, 2));

    // Enviar para o webhook
    const webhookResponse = await fetch(settings.report_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!webhookResponse.ok) {
      console.error('Erro ao enviar webhook:', webhookResponse.status, webhookResponse.statusText);
      const errorText = await webhookResponse.text();
      console.error('Resposta do webhook:', errorText);
      throw new Error(`Erro no webhook: ${webhookResponse.status}`);
    }

    console.log('Relatório enviado com sucesso para o webhook');

    // Atualizar ou criar atividade diária
    if (dailyActivity) {
      await supabase
        .from('daily_activities')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', dailyActivity.id);
    } else {
      await supabase
        .from('daily_activities')
        .insert([{
          date: todayStr,
          leads_added: newLeadsToday,
          events_created: eventsToday,
          messages_sent: 0,
          leads_moved: {}
        }]);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        report_data: reportData,
        webhook_sent: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na geração do relatório:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
