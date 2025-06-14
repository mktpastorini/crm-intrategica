import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMeetingMetrics } from '@/hooks/useMeetingMetrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Target, Calendar, TrendingUp, Phone, Mail, Clock, Award, CheckCircle, Eye } from 'lucide-react';
import UserDetailsModal from '@/components/dashboard/UserDetailsModal';

export default function Dashboard() {
  const { leads, pipelineStages, events, users } = useCrm();
  const { user, profile } = useAuth();
  const meetingMetrics = useMeetingMetrics(events);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // O id do estágio inicial agora é 'aguardando_inicio'
  const STAGE_INITIAL = 'aguardando_inicio';
  const STAGE_PROPOSTA = 'proposta';
  const STAGE_FECHAMENTO = 'fechamento';
  const STAGE_REUNIAO = 'reuniao';
  const STAGE_CONTRATO_ASSINADO = 'contrato_assinado';

  // Atualizado para pegar os leads corretamente com base no novo id do estágio inicial
  const totalLeads = leads.length;

  // Leads que não estão em contrato assinado (filtrando por id correto)
  const leadsInPipeline = leads.filter(lead => lead.pipeline_stage !== STAGE_CONTRATO_ASSINADO).length;

  // Contagem corretas de propostas/enviadas (caso tenha esse id nos estágios)
  const proposalsSent = leads.filter(lead => lead.pipeline_stage === STAGE_PROPOSTA).length;

  // Eventos de reunião agendados para os próximos 7 dias
  const meetingsScheduled = events.filter(event =>
    event.type === STAGE_REUNIAO &&
    new Date(event.date + 'T' + event.time) >= new Date() &&
    new Date(event.date + 'T' + event.time) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  // Função para obter o nome do usuário pelo ID
  const getUserName = (userId: string | null) => {
    if (!userId || !users || users.length === 0) return 'Não atribuído';
    const user = users.find(u => u.id === userId);
    return user?.name || 'Usuário desconhecido';
  };

  // Função para obter a imagem do usuário pelo ID - corrigida
  const getUserAvatar = (userId: string | null) => {
    if (!userId || !users || users.length === 0) return null;
    const foundUser = users.find(u => u.id === userId);
    // Buscar no array de usuários que tem a propriedade avatar_url
    return foundUser ? (foundUser as any).avatar_url : null;
  };

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = (userName: string) => {
    return userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Dados reais para gráficos baseados nos dados atuais
  const statusData = pipelineStages.map(stage => ({
    name: stage.name,
    value: leads.filter(lead => lead.pipeline_stage === stage.id).length,
    color: stage.color
  })).filter(item => item.value > 0); // Só mostrar estágios com leads

  // Dados de performance baseados nos leads reais por mês de criação
  const getPerformanceData = () => {
    const monthlyData: { [key: string]: { leads: number, fechamentos: number } } = {};
    
    leads.forEach(lead => {
      const date = new Date(lead.created_at);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { leads: 0, fechamentos: 0 };
      }
      
      monthlyData[monthKey].leads++;
      if (lead.pipeline_stage === 'contrato-assinado') {
        monthlyData[monthKey].fechamentos++;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6); // Últimos 6 meses
  };

  const performanceData = getPerformanceData();

  // Calcular estatísticas de usuários (baseado em responsáveis)
  const getUserStats = () => {
    if (!users || users.length === 0) return [];
    
    const userStats: { [key: string]: { leads: number, fechamentos: number, userName: string } } = {};
    
    leads.forEach(lead => {
      const userId = lead.responsible_id || 'unassigned';
      const userName = getUserName(lead.responsible_id);
      
      if (!userStats[userId]) {
        userStats[userId] = { leads: 0, fechamentos: 0, userName };
      }
      userStats[userId].leads++;
      if (lead.pipeline_stage === 'contrato-assinado') {
        userStats[userId].fechamentos++;
      }
    });

    return Object.entries(userStats)
      .map(([userId, stats]) => ({ 
        userId, 
        userName: stats.userName,
        leads: stats.leads,
        fechamentos: stats.fechamentos 
      }))
      .sort((a, b) => b.fechamentos - a.fechamentos);
  };

  const userStats = getUserStats();

  // Atividades recentes baseadas em dados reais
  const getRecentActivities = () => {
    const activities = [];
    
    // Últimos leads adicionados
    const recentLeads = leads
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
    
    recentLeads.forEach(lead => {
      const responsibleName = getUserName(lead.responsible_id);
      activities.push({
        type: 'lead',
        message: `Novo lead adicionado: ${lead.company} (Responsável: ${responsibleName})`,
        time: new Date(lead.created_at).toLocaleDateString('pt-BR')
      });
    });

    // Próximos eventos
    const upcomingEvents = events
      .filter(event => new Date(event.date + 'T' + event.time) >= new Date())
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
      .slice(0, 2);

    upcomingEvents.forEach(event => {
      const responsibleName = getUserName(event.responsible_id);
      activities.push({
        type: 'event',
        message: `${event.type === 'reuniao' ? 'Reunião agendada' : 'Evento agendado'} com ${event.lead_name || 'cliente'} (${responsibleName})`,
        time: new Date(event.date).toLocaleDateString('pt-BR')
      });
    });

    return activities.slice(0, 5);
  };

  const recentActivities = getRecentActivities();

  const handleUserDetails = (userId: string) => {
    const userLeads = leads.filter(lead => lead.responsible_id === userId);
    const userEvents = events.filter(event => event.responsible_id === userId);
    const foundUser = users.find(u => u.id === userId);
    
    if (foundUser) {
      setSelectedUser({
        ...foundUser,
        leads: userLeads,
        events: userEvents,
        closedDeals: userLeads.filter(lead => lead.pipeline_stage === 'contrato-assinado').length,
        totalLeads: userLeads.length,
        completedMeetings: userEvents.filter(event => event.completed === true).length,
        scheduledMeetings: userEvents.length
      });
      setShowDetails(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalLeads}</div>
            <p className="text-xs text-blue-600 mt-1">
              {totalLeads > 0 ? 'Leads cadastrados no sistema' : 'Nenhum lead cadastrado'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Leads no Pipeline</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{leadsInPipeline}</div>
            <p className="text-xs text-orange-600 mt-1">
              Em acompanhamento ativo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Propostas Enviadas</CardTitle>
            <Mail className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{proposalsSent}</div>
            <p className="text-xs text-purple-600 mt-1">
              Aguardando retorno
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Reuniões Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{meetingsScheduled}</div>
            <p className="text-xs text-green-600 mt-1">
              Próximos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Reuniões Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{meetingMetrics.today}</div>
            <p className="text-xs text-emerald-600 mt-1">
              Realizadas hoje
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">Total Reuniões</CardTitle>
            <Award className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-900">{meetingMetrics.total}</div>
            <p className="text-xs text-teal-600 mt-1">
              Semana: {meetingMetrics.thisWeek} | Mês: {meetingMetrics.thisMonth}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Status do Pipeline</CardTitle>
            <CardDescription>Distribuição de leads por estágio</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Nenhum lead cadastrado para exibir no gráfico
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Desempenho por Período</CardTitle>
            <CardDescription>Leads captados vs Fechamentos</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="leads" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Leads"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="fechamentos" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Fechamentos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-slate-500">
                Dados insuficientes para gerar o gráfico de desempenho
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ranking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-green-800 flex items-center justify-between">
              <div className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Top Performers
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => console.log('Toggle details')}
                className="text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Detalhamento
              </Button>
            </CardTitle>
            <CardDescription>Usuários com mais fechamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userStats.length > 0 ? (
              userStats.slice(0, 3).map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      index === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                      'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getUserAvatar(user.userId)} alt={user.userName} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                        {getUserInitials(user.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">{user.userName}</p>
                      <p className="text-sm text-slate-600">{user.fechamentos} fechamentos</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={userStats.length > 0 ? (user.fechamentos / Math.max(...userStats.map(u => u.fechamentos))) * 100 : 0} 
                      className="w-20" 
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUserDetails(user.userId)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">
                Nenhum dado de performance disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-800 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas ações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'lead' ? 'bg-green-500' :
                    activity.type === 'event' ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{activity.message}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">
                Nenhuma atividade recente
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UserDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        userData={selectedUser}
      />
    </div>
  );
}
