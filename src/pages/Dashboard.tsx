
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
  const meetingsScheduled = events.filter(event => event.type === 'reunion').length;

  // Dados para gráficos
  const statusData = pipelineStages.map(stage => ({
    name: stage.name,
    value: leads.filter(lead => lead.pipelineStage === stage.id).length,
    color: stage.color
  }));

  const performanceData = [
    { month: 'Jan', leads: 45, fechamentos: 12 },
    { month: 'Fev', leads: 52, fechamentos: 15 },
    { month: 'Mar', leads: 38, fechamentos: 8 },
    { month: 'Abr', leads: 61, fechamentos: 18 },
    { month: 'Mai', leads: 55, fechamentos: 14 },
    { month: 'Jun', leads: 67, fechamentos: 22 },
  ];

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
              +12% em relação ao mês anterior
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
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Desempenho Mensal</CardTitle>
            <CardDescription>Leads captados vs Fechamentos</CardDescription>
          </CardHeader>
          <CardContent>
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
            <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Administrador</p>
                  <p className="text-sm text-slate-600">22 fechamentos</p>
                </div>
              </div>
              <Progress value={95} className="w-20" />
            </div>
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
            <div className="flex items-center space-x-3 p-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-slate-700">Novo lead adicionado: Tech Solutions Ltda</p>
            </div>
            <div className="flex items-center space-x-3 p-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-slate-700">Reunião agendada com Marketing Pro</p>
            </div>
            <div className="flex items-center space-x-3 p-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <p className="text-sm text-slate-700">Proposta enviada para cliente ABC</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
