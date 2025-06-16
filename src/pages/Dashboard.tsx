
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Eye,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import UserDetailsModal from '@/components/dashboard/UserDetailsModal';
import type { Event } from '@/types/event';

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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    scheduledMeetings: 0,
    todayMeetings: 0,
    totalMeetings: 0,
    sentMessages: 0,
    pipelineDistribution: {} as Record<string, number>,
    proposalsSent: { count: 0, totalValue: 0 },
    contractsSigned: { count: 0, revenue: 0 },
    expectedRevenue: 0, // Nova métrica para previsão de faturamento
    topPerformers: [] as Array<{ user: User; dealCount: number; totalRevenue: number; }>
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

    // Métricas de propostas enviadas (apenas leads em estágio de proposta enviada)
    const proposalsSentLeads = leads.filter(lead => 
      lead.pipeline_stage?.toLowerCase().includes('proposta') && 
      lead.pipeline_stage?.toLowerCase().includes('enviada')
    );
    
    const proposalMetrics = proposalsSentLeads.reduce((acc, lead) => {
      acc.count += 1;
      if (lead.proposal_id) {
        const proposal = proposals.find(p => p.id === lead.proposal_id);
        if (proposal && typeof proposal.total_value === 'number') {
          acc.totalValue += proposal.total_value;
        }
      }
      return acc;
    }, { count: 0, totalValue: 0 });

    // Previsão de faturamento (propostas enviadas que ainda não foram assinadas)
    const expectedRevenue = proposalMetrics.totalValue;

    // Métricas de contratos assinados (apenas receita real)
    const contractsSignedLeads = leads.filter(lead =>
      lead.pipeline_stage?.toLowerCase().includes('contrato') ||
      lead.pipeline_stage?.toLowerCase().includes('fechado') ||
      lead.pipeline_stage?.toLowerCase().includes('assinado')
    );

    const contractMetrics = contractsSignedLeads.reduce((acc, lead) => {
      acc.count += 1;
      if (lead.proposal_id) {
        const proposal = proposals.find(p => p.id === lead.proposal_id);
        if (proposal && typeof proposal.total_value === 'number') {
          acc.revenue += proposal.total_value;
        }
      }
      return acc;
    }, { count: 0, revenue: 0 });

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

    // Top Performers com revenue
    const performanceMap = new Map<string, { deals: number; revenue: number }>();
    leads.forEach(lead => {
      const userId = lead.responsible_id;
      if (lead.pipeline_stage?.toLowerCase().includes('contrato') || 
          lead.pipeline_stage?.toLowerCase().includes('fechado') ||
          lead.pipeline_stage?.toLowerCase().includes('assinado')) {
        
        const current = performanceMap.get(userId) || { deals: 0, revenue: 0 };
        current.deals += 1;
        
        if (lead.proposal_id) {
          const proposal = proposals.find(p => p.id === lead.proposal_id);
          if (proposal && typeof proposal.total_value === 'number') {
            current.revenue += proposal.total_value;
          }
        }
        
        performanceMap.set(userId, current);
      }
    });

    const topPerformers = Array.from(performanceMap.entries())
      .map(([userId, performance]) => ({
        user: users.find(u => u.id === userId) || { id: userId, name: 'Usuário Desconhecido', email: '', role: '' },
        dealCount: performance.deals,
        totalRevenue: performance.revenue
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    setStats({
      totalLeads,
      newLeads,
      scheduledMeetings,
      todayMeetings: todayEvents.length,
      totalMeetings: totalMeetingsThisWeek,
      sentMessages: 0,
      pipelineDistribution,
      proposalsSent: proposalMetrics,
      contractsSigned: contractMetrics,
      expectedRevenue, // Nova métrica
      topPerformers
    });
  }, [leads, events, proposals, users]);

  // Preparar dados para gráficos
  const pipelineChartData = Object.entries(stats.pipelineDistribution).map(([stage, count]) => ({
    name: stage,
    value: count,
    leads: count
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const performanceChartData = stats.topPerformers.map(performer => ({
    name: performer.user.name.split(' ')[0],
    deals: performer.dealCount,
    revenue: performer.totalRevenue / 1000 // Em milhares
  }));

  const handleUserClick = (user: User) => {
    const userLeads = leads.filter(lead => lead.responsible_id === user.id);
    const userEvents = events.filter(event => event.responsible_id === user.id);
    const closedDeals = userLeads.filter(lead => 
      lead.pipeline_stage?.toLowerCase().includes('contrato') ||
      lead.pipeline_stage?.toLowerCase().includes('fechado') ||
      lead.pipeline_stage?.toLowerCase().includes('assinado')
    ).length;
    
    const completedMeetings = userEvents.filter(event => event.completed).length;
    const scheduledMeetings = userEvents.filter(event => !event.completed).length;

    setSelectedUser({
      ...user,
      leads: userLeads,
      events: userEvents,
      closedDeals,
      totalLeads: userLeads.length,
      completedMeetings,
      scheduledMeetings
    });
    setShowUserModal(true);
  };

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
    .slice(0, 5)
    .map(lead => ({
      id: lead.id,
      text: `Novo lead: ${lead.name} - ${lead.company}`,
      user: users.find(u => u.id === lead.responsible_id)?.name || 'Admin',
      date: format(parseISO(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }));

  const getEventDateLabel = (dateStr: string) => {
    const eventDate = parseISO(dateStr);
    if (isToday(eventDate)) return 'Hoje';
    if (isTomorrow(eventDate)) return 'Amanhã';
    return format(eventDate, 'dd/MM', { locale: ptBR });
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard Executivo
          </h1>
          <p className="text-slate-600 mt-1">Bem-vindo, {profile?.name || 'Usuário'}!</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">
            R$ {stats.contractsSigned.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-slate-500">Receita Confirmada</div>
          <div className="text-lg font-semibold text-blue-600 mt-1">
            R$ {stats.expectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500">Previsão de Faturamento</div>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">Total de Leads</CardTitle>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">{stats.totalLeads}</div>
            <p className="text-xs text-blue-600 mt-1">
              +{stats.newLeads} esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-700">Pipeline Ativo</CardTitle>
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">{stats.totalLeads - stats.newLeads}</div>
            <p className="text-xs text-orange-600 mt-1">
              Em acompanhamento
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">Propostas Enviadas</CardTitle>
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800">{stats.proposalsSent.count}</div>
            <p className="text-xs text-purple-600 mt-1">
              R$ {stats.proposalsSent.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">Contratos Assinados</CardTitle>
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{stats.contractsSigned.count}</div>
            <p className="text-xs text-green-600 mt-1">
              R$ {stats.contractsSigned.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-cyan-700">Reuniões Hoje</CardTitle>
              <CalendarIcon className="h-6 w-6 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-800">{stats.todayMeetings}</div>
            <p className="text-xs text-cyan-600 mt-1">
              {stats.scheduledMeetings} agendadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-indigo-700">Taxa Conversão</CardTitle>
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-800">
              {stats.totalLeads > 0 ? ((stats.contractsSigned.count / stats.totalLeads) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              Lead para contrato
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Pipeline */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Distribuição do Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pipelineChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pipelineChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Performance */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Performance dos Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `R$ ${(Number(value) * 1000).toLocaleString('pt-BR')}` : value,
                    name === 'revenue' ? 'Receita' : 'Negócios'
                  ]}
                />
                <Bar dataKey="deals" fill="#8884d8" name="deals" />
                <Bar dataKey="revenue" fill="#82ca9d" name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-green-800">
                <Award className="w-5 h-5 mr-2" />
                Top Performers
              </CardTitle>
              <p className="text-sm text-green-600">Ranking por receita gerada</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topPerformers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Nenhum fechamento registrado ainda</p>
              ) : (
                stats.topPerformers.map((performer, index) => (
                  <div 
                    key={performer.user.id} 
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200 hover:border-green-300 cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleUserClick(performer.user)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-green-400 to-green-600'
                        }`}>
                          {index + 1}
                        </div>
                        {index < 3 && (
                          <Award className={`absolute -top-1 -right-1 w-5 h-5 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-400' :
                            'text-orange-500'
                          }`} />
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        {performer.user.avatar_url ? (
                          <img 
                            src={performer.user.avatar_url} 
                            alt={performer.user.name}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="text-xs font-medium text-white">
                              {performer.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-green-800">{performer.user.name}</div>
                          <div className="text-sm text-green-600">
                            {performer.dealCount} negócios • R$ {performer.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atividades Recentes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Nenhuma atividade recente</p>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">{activity.text}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Por {activity.user} • {activity.date}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <UserDetailsModal 
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        userData={selectedUser}
      />
    </div>
  );
}
