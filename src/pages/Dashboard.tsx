import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, CheckCircle, User, Users, TrendingUp, FileText } from 'lucide-react';
import { useActivityTracker } from '@/hooks/useActivityTracker';

interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  activeLeads: number;
  eventsToday: number;
  completedEvents: number;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { leads, events, pipelineStages, proposals } = useCrm();
  
  // Calculate metrics
  const newLeadsToday = leads.filter(lead => {
    const leadDate = new Date(lead.created_at).toDateString();
    const todayDate = new Date().toDateString();
    return leadDate === todayDate;
  }).length;

  const activeLeads = leads.filter(lead => lead.status !== 'concluido' && lead.status !== 'perdido');

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start_time).toDateString();
    const todayDate = new Date().toDateString();
    return eventDate === todayDate;
  });

  const completedEvents = todayEvents.filter(event => event.completed).length;

  // Calculate proposal metrics
  const getProposalMetrics = () => {
    const propostaEnviadaStage = pipelineStages.find(s => 
      s.name.toLowerCase().includes('proposta') && s.name.toLowerCase().includes('enviada')
    );
    
    if (!propostaEnviadaStage) return 0;

    const leadsWithProposals = leads
      .filter(lead => lead.pipeline_stage === propostaEnviadaStage.id && lead.proposal_id);
    
    const totalValue = leadsWithProposals.reduce((sum, lead) => {
      const proposal = proposals.find(p => p.id === lead.proposal_id);
      return sum + (proposal?.total_value || 0);
    }, 0);

    return totalValue;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Inicializar o rastreador de atividades
  const { trackActivity } = useActivityTracker();

  useEffect(() => {
    // Rastrear a visita à página
    trackActivity('visit_dashboard', { userId: user?.id, userName: user?.email });
  }, [trackActivity, user?.id, user?.email]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Olá, {profile?.name || user?.email?.split('@')[0]}! 👋
        </h1>
        <p className="text-slate-600">
          Aqui está um resumo das suas atividades hoje
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
              <CalendarDays className="h-3 w-3" />
              <span>{newLeadsToday} novos hoje</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            <CalendarDays className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEvents.length}</div>
            <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
              <CheckCircle className="h-3 w-3" />
              <span>{completedEvents} concluídos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeads.length}</div>
            <div className="text-xs text-slate-600 mt-1">
              Em processo de vendas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Propostas</CardTitle>
            <FileText className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(getProposalMetrics())}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Estimativa financeira
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>Suas últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            Em breve...
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>Seus compromissos agendados</CardDescription>
          </CardHeader>
          <CardContent>
            Em breve...
          </CardContent>
        </Card>
      </div> */}
    </div>
  );
}
