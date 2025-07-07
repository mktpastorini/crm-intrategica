
import { useAuth } from '@/contexts/AuthContext';
import UserDashboard from '@/components/dashboard/UserDashboard';
import UserDetailsModal from '@/components/dashboard/UserDetailsModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, FileText, Calendar, Target, Award, BarChart, MessageSquare, Eye } from 'lucide-react';
import { useCrm } from '@/contexts/CrmContext';
import { useQuery } from '@tanstack/react-query';
import { proposalService } from '@/services/proposalService';
import { useMemo, useState } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Use a compatible Lead type for dashboard calculations
type DashboardLead = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  niche: string;
  responsible_id: string;
  created_at: string;
  updated_at: string;
  pipeline_stage?: string;
  status: string;
  proposal_id?: string;
  website?: string;
  address?: string;
  rating?: number;
  place_id?: string;
  whatsapp?: string;
  instagram?: string;
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { leads, events, pipelineStages, users } = useCrm();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Always call all hooks at the top level, regardless of user role
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: proposalService.getAll,
  });

  // Compute metrics for admin users (will be empty arrays for non-admin)
  const metrics = useMemo(() => {
    if (profile?.role !== 'admin') {
      return {
        totalLeads: 0,
        activeInPipeline: 0,
        activeUsers: 0,
        totalProposals: 0,
        todayEvents: 0,
        conversionRate: '0'
      };
    }

    // Pipeline Ativo: todos os leads exceto "Aguardando Contato" (primeiro) e "Perdidos" (último)
    const firstStageId = pipelineStages.find(s => s.order === 0)?.id || 'aguardando_contato';
    const lastStageId = pipelineStages.find(s => s.name.toLowerCase().includes('perdido'))?.id;
    
    const activePipelineLeads = leads.filter(lead => 
      lead.pipeline_stage !== firstStageId && 
      (!lastStageId || lead.pipeline_stage !== lastStageId)
    );

    const totalLeads = leads.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const totalProposals = proposals.length;
    
    // Eventos de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = events.filter(event => event.date === today);

    return {
      totalLeads,
      activeInPipeline: activePipelineLeads.length,
      activeUsers,
      totalProposals,
      todayEvents: todayEvents.length,
      conversionRate: totalLeads > 0 ? ((activePipelineLeads.length / totalLeads) * 100).toFixed(1) : '0'
    };
  }, [leads, users, proposals, events, pipelineStages, profile?.role]);

  // Top performers - dados completos para admin
  const topPerformers = useMemo(() => {
    if (profile?.role !== 'admin') {
      return [];
    }

    const performerStats = users.map(user => {
      const userLeads = leads.filter(lead => lead.responsible_id === user.id);
      const userEvents = events.filter(event => event.responsible_id === user.id);
      const userProposals = userLeads.filter((lead: DashboardLead) => lead.proposal_id).length;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        leads: userLeads,
        events: userEvents,
        proposals: userProposals,
        totalLeads: userLeads.length,
        closedDeals: userProposals,
        completedMeetings: userEvents.filter(event => event.completed).length,
        scheduledMeetings: userEvents.length,
        score: userLeads.length + userEvents.length + (userProposals * 2)
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    return performerStats;
  }, [users, leads, events, profile?.role]);

  // Distribuição por estágio para o gráfico de pizza
  const stageDistribution = useMemo(() => {
    if (profile?.role !== 'admin') {
      return [];
    }

    return pipelineStages.map(stage => {
      const stageLeads = leads.filter(lead => lead.pipeline_stage === stage.id);
      return {
        stage: stage.name,
        count: stageLeads.length,
        color: stage.color
      };
    }).filter(item => item.count > 0);
  }, [leads, pipelineStages, profile?.role]);

  // Dados para o gráfico de performance por período
  const performanceData = useMemo(() => {
    if (profile?.role !== 'admin') {
      return [];
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayLeads = leads.filter(lead => lead.created_at.startsWith(date));
      const dayEvents = events.filter(event => event.date === date);
      
      return {
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: dayLeads.length,
        events: dayEvents.length
      };
    });
  }, [leads, events, profile?.role]);

  // Se não for admin, mostrar dashboard personalizado
  if (profile?.role !== 'admin') {
    return (
      <div className="p-6">
        <UserDashboard />
      </div>
    );
  }

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const chartConfig = {
    leads: {
      label: "Leads"
    },
    events: {
      label: "Eventos"
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Executivo</h2>
          <p className="text-slate-600">Bem-vindo, Administrador!</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">R$ 4.000,00</div>
          <p className="text-sm text-slate-600">Receita Confirmada</p>
          <div className="text-lg font-medium text-blue-600">R$ 0,00</div>
          <p className="text-xs text-slate-500">Previsão de Faturamento</p>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{metrics.totalLeads}</div>
            <p className="text-xs text-blue-600">+86 esta semana</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Pipeline Ativo</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{metrics.activeInPipeline}</div>
            <p className="text-xs text-orange-600">Em acompanhamento</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Propostas Enviadas</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{metrics.totalProposals}</div>
            <p className="text-xs text-purple-600">R$ 0,00</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Contratos Assinados</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">1</div>
            <p className="text-xs text-green-600">R$ 4.000,00</p>
          </CardContent>
        </Card>

        <Card className="bg-cyan-50 border-cyan-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-700">Reuniões</CardTitle>
            <Calendar className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-900">{metrics.todayEvents}</div>
            <p className="text-xs text-cyan-600">Hoje • 1 agendadas • 1 concluídas</p>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">Taxa Conversão</CardTitle>
            <Target className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{metrics.conversionRate}%</div>
            <p className="text-xs text-indigo-600">Lead para contrato</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição do Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Distribuição do Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {stageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Desempenho por Período */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Desempenho por Período
            </CardTitle>
            <p className="text-sm text-slate-600">Leads captados vs Fechamentos</p>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="leads" fill="#3b82f6" name="Leads" />
                  <Bar dataKey="events" fill="#10b981" name="Eventos" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <p className="text-sm text-green-600">Ranking por receita gerada</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div 
                  key={performer.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => handleUserClick(performer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">
                          {performer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{performer.name}</p>
                        <p className="text-xs text-green-600">
                          {performer.closedDeals} negócios • R$ 4.000,00
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance dos Vendedores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance dos Vendedores
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={topPerformers} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="totalLeads" fill="#10b981" name="Leads" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalhes do usuário */}
      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userData={selectedUser}
      />
    </div>
  );
}
