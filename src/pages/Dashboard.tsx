
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
  DollarSign,
  Eye
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    scheduledMeetings: 0,
    todayMeetings: 0,
    totalMeetings: 0,
    sentMessages: 0,
    pipelineDistribution: {} as Record<string, number>,
    proposalsSent: { count: 0, totalValue: 0 },
    topPerformers: [] as Array<{ user: User; dealCount: number; }>
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

  // Buscar usuários
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
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

    // Reuniões
    const scheduledMeetings = events.filter(event =>
      event.type === 'reunion' && !event.completed
    ).length;

    const todayEvents = events.filter(event => {
      const eventDate = parseISO(event.date);
      return isToday(eventDate) && !event.completed;
    });

    const totalMeetingsThisWeek = events.filter(event => {
      const eventDate = parseISO(event.date);
      return eventDate >= lastWeek && eventDate <= addDays(today, 7);
    }).length;

    // Top Performers
    const performanceMap = new Map<string, number>();
    leads.forEach(lead => {
      const userId = lead.responsible_id;
      if (lead.pipeline_stage?.toLowerCase().includes('contrato') || 
          lead.pipeline_stage?.toLowerCase().includes('fechado')) {
        performanceMap.set(userId, (performanceMap.get(userId) || 0) + 1);
      }
    });

    const topPerformers = Array.from(performanceMap.entries())
      .map(([userId, dealCount]) => ({
        user: users.find(u => u.id === userId) || { id: userId, name: 'Usuário Desconhecido', email: '', role: '' },
        dealCount
      }))
      .sort((a, b) => b.dealCount - a.dealCount)
      .slice(0, 3);

    setStats({
      totalLeads,
      newLeads,
      scheduledMeetings,
      todayMeetings: todayEvents.length,
      totalMeetings: totalMeetingsThisWeek,
      sentMessages: 0, // Placeholder
      pipelineDistribution,
      proposalsSent: proposalMetrics,
      topPerformers
    });
  }, [leads, events, proposals, users]);

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

  // Atividades recentes
  const recentActivities = leads
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map(lead => ({
      id: lead.id,
      text: `Novo lead adicionado: ${lead.name} - ${lead.company} (Responsável: ${users.find(u => u.id === lead.responsible_id)?.name || 'Administrador'})`,
      date: format(parseISO(lead.created_at), 'dd/MM/yyyy', { locale: ptBR })
    }));

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-blue-50 border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total de Leads</CardTitle>
            <Users className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats.totalLeads}</div>
            <p className="text-xs text-blue-600">
              Leads cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Leads no Pipeline</CardTitle>
            <TrendingUp className="h-6 w-6 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{stats.totalLeads - stats.newLeads}</div>
            <p className="text-xs text-orange-600">
              Em acompanhamento ativo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Propostas Enviadas</CardTitle>
            <FileText className="h-6 w-6 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{stats.proposalsSent.count}</div>
            <p className="text-xs text-purple-600">
              Aguardando retorno
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Reuniões Agendadas</CardTitle>
            <CalendarIcon className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats.scheduledMeetings}</div>
            <p className="text-xs text-green-600">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Reuniões Hoje</CardTitle>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">{stats.todayMeetings}</div>
            <p className="text-xs text-green-600">
              Realizadas hoje
            </p>
          </CardContent>
        </Card>

        <Card className="bg-cyan-50 border-l-4 border-l-cyan-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-700">Total Reuniões</CardTitle>
            <Users className="h-6 w-6 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-800">{stats.totalMeetings}</div>
            <p className="text-xs text-cyan-600">
              Semana: 0 | Mês: {stats.totalMeetings}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status do Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Pipeline</CardTitle>
            <p className="text-sm text-slate-600">Distribuição de leads por estágio</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.pipelineDistribution).map(([stage, count], index) => {
                const colors = ['#9CA3AF', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444'];
                const color = colors[index % colors.length];
                const percentage = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                
                return (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm">{stage}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{percentage}%</span>
                      <span className="text-xs text-slate-500">({count})</span>
                    </div>
                  </div>
                );
              })}
              {stats.proposalsSent.totalValue > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Valor Total em Propostas</span>
                    <span className="text-lg font-bold text-green-800">
                      R$ {stats.proposalsSent.totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Desempenho por Período */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Período</CardTitle>
            <p className="text-sm text-slate-600">Leads captados vs Fechamentos</p>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">Dados de performance em desenvolvimento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Top Performers
              </CardTitle>
              <p className="text-sm text-slate-600">Usuários com mais fechamentos</p>
            </div>
            <Button variant="ghost" size="sm" className="text-slate-500">
              <Eye className="w-4 h-4 mr-1" />
              Detalhamento
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPerformers.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum fechamento registrado ainda</p>
              ) : (
                stats.topPerformers.map((performer, index) => (
                  <div key={performer.user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-800 rounded-full font-bold">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2">
                        {performer.user.avatar_url ? (
                          <img 
                            src={performer.user.avatar_url} 
                            alt={performer.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-slate-600">
                              {performer.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm">{performer.user.name}</div>
                          <div className="text-xs text-slate-500">{performer.dealCount} fechamentos</div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Atividades Recentes
            </CardTitle>
            <p className="text-sm text-slate-600">Últimas ações do sistema</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma atividade recente</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm">{activity.text}</div>
                      <div className="text-xs text-slate-500 mt-1">{activity.date}</div>
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
