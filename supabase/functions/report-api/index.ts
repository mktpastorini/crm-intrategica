
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

    const url = new URL(req.url);
    const tipo = url.searchParams.get('tipo') || 'dia';

    console.log(`Gerando relatório: ${tipo}`);

    // Buscar configurações do sistema
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodDescription: string;

    // Definir período baseado no tipo
    switch (tipo) {
      case 'semana':
        // Início da semana (domingo)
        startDate = new Date(now);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        
        periodDescription = 'semanal';
        break;
        
      case 'mes':
        // Início do mês
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        periodDescription = 'mensal';
        break;
        
      default: // 'dia'
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = now;
        periodDescription = 'diário';
    }

    console.log(`Coletando dados do período ${periodDescription}: ${startDate.toISOString()} até ${endDate.toISOString()}`);

    // Coletar dados do período
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, pipeline_stage, created_at')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    const { data: eventsData } = await supabase
      .from('events')
      .select('id, completed, title, type, created_at')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    const { data: completedEvents } = await supabase
      .from('events')
      .select('id, title, type')
      .eq('completed', true)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    // Para relatórios não diários, agregar dados de daily_activities
    let aggregatedActivities = { leads_moved: {}, messages_sent: 0 };
    
    if (tipo !== 'dia') {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const { data: dailyActivities } = await supabase
        .from('daily_activities')
        .select('*')
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      if (dailyActivities) {
        aggregatedActivities.messages_sent = dailyActivities.reduce((sum, day) => sum + (day.messages_sent || 0), 0);
        
        // Agregar movimentações de leads
        dailyActivities.forEach(day => {
          if (day.leads_moved && typeof day.leads_moved === 'object') {
            Object.entries(day.leads_moved).forEach(([stage, count]) => {
              aggregatedActivities.leads_moved[stage] = (aggregatedActivities.leads_moved[stage] || 0) + (count as number);
            });
          }
        });
      }
    } else {
      // Para relatório diário, buscar dados do dia atual
      const todayStr = startDate.toISOString().split('T')[0];
      const { data: todayActivity } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('date', todayStr)
        .maybeSingle();
        
      if (todayActivity) {
        aggregatedActivities.messages_sent = todayActivity.messages_sent || 0;
        aggregatedActivities.leads_moved = todayActivity.leads_moved || {};
      }
    }

    // Processar dados
    const leadsAdded = leadsData?.length || 0;
    const eventsCreated = eventsData?.length || 0;
    const eventsCompleted = completedEvents?.length || 0;

    // Formatar leads movidos
    const leadsMovedFormatted = Object.entries(aggregatedActivities.leads_moved)
      .filter(([_, count]) => (count as number) > 0)
      .reduce((acc, [stage, count]) => {
        acc[stage] = `${count} lead${(count as number) > 1 ? 's' : ''} movido${(count as number) > 1 ? 's' : ''} para ${stage}`;
        return acc;
      }, {} as Record<string, string>);

    // Estatísticas por estágio
    const leadsByStage: Record<string, number> = {};
    if (leadsData) {
      leadsData.forEach(lead => {
        const stage = lead.pipeline_stage || 'Sem estágio';
        leadsByStage[stage] = (leadsByStage[stage] || 0) + 1;
      });
    }

    // Preparar dados do relatório
    const reportData = {
      tipo: tipo,
      relatorio: periodDescription,
      date: now.toISOString().split('T')[0],
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        generated_at: now.toISOString(),
        description: periodDescription
      },
      summary: {
        leads_added: leadsAdded,
        leads_moved: leadsMovedFormatted,
        messages_sent: aggregatedActivities.messages_sent,
        events_created: eventsCreated,
        events_completed: eventsCompleted
      },
      details: {
        total_activities: leadsAdded + aggregatedActivities.messages_sent + eventsCreated + eventsCompleted,
        leads_by_stage: leadsByStage,
        completed_events: completedEvents || [],
        system_name: settings?.system_name || "Sistema CRM"
      },
      whatsapp_number: settings?.report_whatsapp_number || ''
    };

    console.log('Relatório gerado:', JSON.stringify(reportData, null, 2));

    return new Response(
      JSON.stringify(reportData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
