import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { proposalService } from '@/services/proposalService';
import { 
  Users, 
  UserPlus, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  niche: string;
  responsible_id: string;
  created_at: string;
  pipeline_stage: string;
  proposal_id?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  completed: boolean;
  lead_name?: string;
  company?: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    scheduledMeetings: 0,
    sentMessages: 0,
    pipelineDistribution: {} as Record<string, number>,
    proposalsSent: { count: 0, totalValue: 0 }
  });

  // Buscar leads
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar eventos
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar propostas
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: proposalService.getAll,
  });

  // Calcular estatísticas
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Leads básicos
    const totalLeads = leads.length;
    const newLeads = leads.filter(lead => 
      new Date(lead.created_at) >= lastWeek
    ).length;

    // Distribuição por pipeline
    const pipelineDistribution: Record<string, number> = {};
    leads.forEach(lead => {
      const stage = lead.pipeline_stage || 'Sem estágio';
      pipelineDistribution[stage] = (pipelineDistribution[stage] || 0) + 1;
    });

    // Métricas de propostas enviadas
    const proposalsSentLeads = leads.filter(lead => 
      lead.pipeline_stage?.toLowerCase().includes('proposta') && 
      lead.pipeline_stage?.toLowerCase().includes('enviada')
    );
    
    const proposalMetrics = proposalsSentLeads.reduce((acc, lead) => {
      acc.count += 1;
      if (lead.proposal_id) {
        const proposal = proposals.find(p => p.id === lead.proposal_id);
        if (proposal) {
          acc.totalValue += proposal.total_value;
        }
      }
      return acc;
    }, { count: 0, totalValue: 0 });

    // Reuniões agendadas
    const scheduledMeetings = events.filter(event =>
      event.type === 'reuniao' && !event.completed
    ).length;

    setStats({
      totalLeads,
      newLeads,
      scheduledMeetings,
      sentMessages: 0, // Placeholder
      pipelineDistribution,
      proposalsSent: proposalMetrics
    });
  }, [leads, events, proposals]);

  // Próximos eventos
  const upcomingEvents = events
    .filter(event => !event.completed)
    .filter(event => {
      const eventDate = parseISO(event.date);
      const today = new Date();
      const nextWeek = addDays(today, 7);
      return eventDate >= today && eventDate <= nextWeek;
    })
    .slice(0, 5);

  // Leads recentes
  const recentLeads = leads.slice(0, 5);

  const getEventDateLabel = (dateStr: string) => {
    const eventDate = parseISO(dateStr);
    if (isToday(eventDate)) return 'Hoje';
    if (isTomorrow(eventDate)) return 'Amanhã';
    return format(eventDate, 'dd/MM', { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <div className="text-sm text-slate-500">
          Bem-vindo, {profile?.name || 'Usuário'}!
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newLeads} nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newLeads}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reuniões Agendadas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduledMeetings}</div>
            <p className="text-xs text-muted-foreground">
              Próximas reuniões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas Enviadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposalsSent.count}</div>
            <p className="text-xs text-green-600 font-medium">
              R$ {stats.proposalsSent.totalValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição do Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Estágio do Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.pipelineDistribution).map(([stage, count]) => (
              <div key={stage} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-slate-600">{stage}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum evento próximo</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs text-slate-500">
                        {event.lead_name && `${event.lead_name} - `}
                        {event.company}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-blue-600">
                        {getEventDateLabel(event.date)}
                      </div>
                      <div className="text-xs text-slate-500">{event.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Leads Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeads.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum lead cadastrado</p>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{lead.name}</div>
                      <div className="text-xs text-slate-500">{lead.company}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {lead.pipeline_stage}
                      </Badge>
                      <div className="text-xs text-slate-500 mt-1">
                        {format(parseISO(lead.created_at), 'dd/MM', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
