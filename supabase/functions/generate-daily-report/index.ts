
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

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Definir janela de tempo do dia (00:00 até agora)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = now;

    console.log(`Coletando dados do período: ${startOfDay.toISOString()} até ${endOfDay.toISOString()}`);

    // 1. Leads adicionados hoje
    const { data: leadsToday, error: leadsError } = await supabase
      .from('leads')
      .select('id, pipeline_stage, created_at')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    if (leadsError) {
      console.error('Erro ao buscar leads:', leadsError);
    }

    // 2. Eventos criados hoje
    const { data: eventsToday, error: eventsError } = await supabase
      .from('events')
      .select('id, completed, created_at')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    if (eventsError) {
      console.error('Erro ao buscar eventos:', eventsError);
    }

    // 3. Eventos concluídos hoje
    const { data: completedEvents, error: completedError } = await supabase
      .from('events')
      .select('id, completed, title, type')
      .eq('completed', true)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    if (completedError) {
      console.error('Erro ao buscar eventos concluídos:', completedError);
    }

    // 4. Buscar dados de atividades diárias rastreadas
    const { data: dailyActivity } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    // Processar dados coletados
    const leadsAdded = leadsToday?.length || 0;
    const eventsCreated = eventsToday?.length || 0;
    const eventsCompleted = completedEvents?.length || 0;
    const messagesSent = dailyActivity?.messages_sent || 0;
    
    // Formatar leads movidos no novo formato
    const leadsMovedData = dailyActivity?.leads_moved || {};
    const leadsMovedFormatted = Object.entries(leadsMovedData)
      .filter(([_, count]) => (count as number) > 0)
      .reduce((acc, [stage, count]) => {
        acc[stage] = `${count} lead${(count as number) > 1 ? 's' : ''} movido${(count as number) > 1 ? 's' : ''} para ${stage}`;
        return acc;
      }, {} as Record<string, string>);
    
    // Estatísticas dos leads por estágio
    const leadsByStage: Record<string, number> = {};
    if (leadsToday) {
      leadsToday.forEach(lead => {
        const stage = lead.pipeline_stage || 'Sem estágio';
        leadsByStage[stage] = (leadsByStage[stage] || 0) + 1;
      });
    }

    // Detalhes dos eventos concluídos
    const completedEventsDetails = completedEvents?.map(event => ({
      title: event.title,
      type: event.type,
      completed: true
    })) || [];

    // Preparar dados do relatório
    const reportData = {
      date: today,
      period: {
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString(),
        generated_at: now.toISOString()
      },
      summary: {
        leads_added: leadsAdded,
        leads_moved: leadsMovedFormatted,
        messages_sent: messagesSent,
        events_created: eventsCreated,
        events_completed: eventsCompleted
      },
      details: {
        total_activities: leadsAdded + messagesSent + eventsCreated + eventsCompleted,
        leads_by_stage: leadsByStage,
        completed_events: completedEventsDetails,
        system_name: settings.system_name || "Sistema CRM",
        report_scheduled_time: settings.report_webhook_time || '18:00',
        data_completeness: {
          leads_data: leadsToday ? 'complete' : 'unavailable',
          events_data: eventsToday ? 'complete' : 'unavailable',
          completed_events_data: completedEvents ? 'complete' : 'unavailable',
          messages_data: dailyActivity ? 'tracked' : 'not_tracked',
          leads_movement_data: dailyActivity?.leads_moved ? 'tracked' : 'not_tracked'
        }
      },
      whatsapp_number: settings.report_whatsapp_number || '',
      test: false
    };

    console.log('Dados do relatório preparados:', JSON.stringify(reportData, null, 2));

    // Enviar para o webhook
    console.log('Enviando para webhook:', settings.report_webhook_url);
    
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
          error: 'Erro ao enviar relatório para webhook',
          status: response.status,
          statusText: response.statusText,
          details: errorText,
          webhook_url: settings.report_webhook_url
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseText = await response.text();
    console.log('Relatório enviado com sucesso para webhook. Resposta:', responseText);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Relatório diário enviado com sucesso para webhook',
        webhook_url: settings.report_webhook_url,
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
