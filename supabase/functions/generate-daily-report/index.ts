
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

    // Calcular janela de tempo do dia atual
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const reportTime = settings.report_webhook_time || '18:00';
    const [reportHour, reportMinute] = reportTime.split(':').map(Number);
    
    // Início do dia (00:00:00)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    // Horário programado do relatório ou agora (o que for menor)
    const reportDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), reportHour, reportMinute, 0);
    const endOfPeriod = now < reportDateTime ? now : reportDateTime;

    console.log(`Coletando dados do período: ${startOfDay.toISOString()} até ${endOfPeriod.toISOString()}`);

    // Coletar dados diretamente das tabelas principais para maior precisão
    
    // 1. Leads adicionados hoje
    const { data: leadsToday, error: leadsError } = await supabase
      .from('leads')
      .select('id, pipeline_stage, created_at')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfPeriod.toISOString());

    if (leadsError) {
      console.error('Erro ao buscar leads:', leadsError);
    }

    // 2. Leads movidos entre estágios hoje (através da tabela daily_activities como backup)
    const { data: dailyActivity } = await supabase
      .from('daily_activities')
      .select('leads_moved')
      .eq('date', today)
      .maybeSingle();

    // 3. Eventos criados hoje
    const { data: eventsToday, error: eventsError } = await supabase
      .from('events')
      .select('id, created_at')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfPeriod.toISOString());

    if (eventsError) {
      console.error('Erro ao buscar eventos:', eventsError);
    }

    // 4. Contagem de mensagens da tabela daily_activities (pois não temos tabela específica)
    const messagesSent = dailyActivity?.messages_sent || 0;

    // Processar dados coletados
    const leadsAdded = leadsToday?.length || 0;
    const eventsCreated = eventsToday?.length || 0;
    
    // Leads movidos entre estágios (usar dados do rastreamento automático)
    const leadsMovedData = dailyActivity?.leads_moved || {};
    
    // Calcular estatísticas adicionais dos leads
    const leadsByStage: Record<string, number> = {};
    if (leadsToday) {
      leadsToday.forEach(lead => {
        const stage = lead.pipeline_stage || 'Sem estágio';
        leadsByStage[stage] = (leadsByStage[stage] || 0) + 1;
      });
    }

    // Preparar dados do relatório
    const reportData = {
      date: today,
      period: {
        start: startOfDay.toISOString(),
        end: endOfPeriod.toISOString(),
        generated_at: now.toISOString()
      },
      summary: {
        leads_added: leadsAdded,
        leads_moved: leadsMovedData,
        messages_sent: messagesSent,
        events_created: eventsCreated
      },
      details: {
        total_activities: leadsAdded + messagesSent + eventsCreated,
        leads_by_stage: leadsByStage,
        system_name: settings.system_name || "Sistema CRM",
        report_scheduled_time: reportTime,
        data_completeness: {
          leads_data: leadsToday ? 'complete' : 'unavailable',
          events_data: eventsToday ? 'complete' : 'unavailable',
          messages_data: dailyActivity ? 'tracked' : 'not_tracked',
          leads_movement_data: dailyActivity?.leads_moved ? 'tracked' : 'not_tracked'
        }
      },
      whatsapp_number: settings.report_whatsapp_number || '',
      test: false
    };

    console.log('Dados do relatório preparados:', JSON.stringify(reportData, null, 2));

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
      const errorText = await response.text();
      console.error('Erro ao enviar relatório:', response.status, response.statusText, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao enviar relatório',
          status: response.status,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await response.text();
    console.log('Relatório enviado com sucesso. Resposta:', responseText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Relatório diário enviado com sucesso',
        data: reportData,
        webhook_response: responseText
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
