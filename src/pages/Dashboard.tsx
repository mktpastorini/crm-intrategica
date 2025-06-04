
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, Target, Calendar, TrendingUp, Phone, Mail, Clock, Award } from 'lucide-react';

export default function Dashboard() {
  const { leads, pipelineStages, events } = useCrm();

  const totalLeads = leads.length;
  const leadsInPipeline = leads.filter(lead => lead.pipelineStage !== 'contrato-assinado').length;
  const proposalsSent = leads.filter(lead => lead.pipelineStage === 'proposta-enviada').length;
  const meetingsScheduled = events.filter(event => 
    event.type === 'reunion' && 
    new Date(event.date + 'T' + event.time) >= new Date() &&
    new Date(event.date + 'T' + event.time) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  // Real data for charts based on current data
  const statusData = pipelineStages.map(stage => ({
    name: stage.name,
    value: leads.filter(lead => lead.pipelineStage === stage.id).length,
    color: stage.color
  })).filter(item => item.value > 0);

  // Performance data based on real leads by creation month
  const getPerformanceData = () => {
    const monthlyData: { [key: string]: { leads: number, fechamentos: number } } = {};
    
    leads.forEach(lead => {
      const date = new Date(lead.createdAt);
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { leads: 0, fechamentos: 0 };
      }
      
      monthlyData[monthKey].leads++;
      if (lead.pipelineStage === 'contrato-assinado') {
        monthlyData[monthKey].fechamentos++;
      }
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);
  };

  const performanceData = getPerformanceData();

  // Calculate user stats (based on responsibles)
  const getUserStats = () => {
    const userStats: { [key: string]: { leads: number, fechamentos: number } } = {};
    
    leads.forEach(lead => {
      const userName = lead.responsible?.name || 'Não atribuído';
      if (!userStats[userName]) {
        userStats[userName] = { leads: 0, fechamentos: 0 };
      }
      userStats[userName].leads++;
      if (lead.pipelineStage === 'contrato-assinado') {
        userStats[userName].fechamentos++;
      }
    });

    return Object.entries(userStats)
      .map(([user, stats]) => ({ user, ...stats }))
      .sort((a, b) => b.fechamentos - a.fechamentos);
  };

  const userStats = getUserStats();

  // Recent activities based on real data
  const getRecentActivities = () => {
    const activities = [];
    
    // Latest added leads
    const recentLeads = leads
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    recentLeads.forEach(lead => {
      activities.push({
        type: 'lead',
        message: `Novo lead adicionado: ${lead.company}`,
        time: new Date(lead.createdAt).toLocaleDateString('pt-BR')
      });
    });

    // Upcoming events
    const upcomingEvents = events
      .filter(event => new Date(event.date + 'T' + event.time) >= new Date())
      .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
      .slice(0, 2);

    upcomingEvents.forEach(event => {
      activities.push({
        type: 'event',
        message: `${event.type === 'reunion' ? 'Reunião agendada' : 'Evento agendado'} com ${event.leadName || 'cliente'}`,
        time: new Date(event.date).toLocaleDateString('pt-BR')
      });
    });

    return activities.slice(0, 5);
  };

  const recentActivities = getRecentActivities();

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-lg font-semibold text-green-800 flex items-center">
              <Award className="mr-2 h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>Usuários com mais fechamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userStats.length > 0 ? (
              userStats.slice(0, 3).map((user, index) => (
                <div key={user.user} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                      index === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                      'bg-gradient-to-r from-gray-400 to-gray-500'
                    }`}>
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{user.user}</p>
                      <p className="text-sm text-slate-600">{user.fechamentos} fechamentos</p>
                    </div>
                  </div>
                  <Progress 
                    value={userStats.length > 0 ? (user.fechamentos / Math.max(...userStats.map(u => u.fechamentos))) * 100 : 0} 
                    className="w-20" 
                  />
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
    </div>
  );
}
