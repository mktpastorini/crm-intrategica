import { useAuth } from '@/contexts/AuthContext';
import UserDashboard from '@/components/dashboard/UserDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, FileText, Calendar, Target, Award, BarChart, MessageSquare } from 'lucide-react';
import { useCrm } from '@/contexts/CrmContext';
import { useQuery } from '@tanstack/react-query';
import { proposalService } from '@/services/proposalService';
import { useMemo } from 'react';

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

  // Se não for admin, mostrar dashboard personalizado
  if (profile?.role !== 'admin') {
    return (
      <div className="p-6">
        <UserDashboard />
      </div>
    );
  }

  // Dashboard completo para administradores
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: proposalService.getAll,
  });

  const metrics = useMemo(() => {
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
  }, [leads, users, proposals, events, pipelineStages]);

  // Top performers - dados completos para admin
  const topPerformers = useMemo(() => {
    const performerStats = users.map(user => {
      const userLeads = leads.filter(lead => lead.responsible_id === user.id);
      const userEvents = events.filter(event => event.responsible_id === user.id);
      const userProposals = userLeads.filter((lead: DashboardLead) => lead.proposal_id).length;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        leads: userLeads.length,
        events: userEvents.length,
        proposals: userProposals,
        score: userLeads.length + userEvents.length + (userProposals * 2)
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5);

    return performerStats;
  }, [users, leads, events]);

  // Distribuição por estágio
  const stageDistribution = useMemo(() => {
    return pipelineStages.map(stage => {
      const stageLeads = leads.filter(lead => lead.pipeline_stage === stage.id);
      return {
        stage: stage.name,
        count: stageLeads.length,
        color: stage.color
      };
    }).filter(item => item.count > 0);
  }, [leads, pipelineStages]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Administrativo</h2>
        <Badge variant="secondary" className="text-sm">
          Visão Completa do Sistema
        </Badge>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Todos os leads no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Ativo</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeInPipeline}</div>
            <p className="text-xs text-muted-foreground">Leads em processo (exceto aguardando e perdidos)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.totalProposals}</div>
            <p className="text-xs text-muted-foreground">Total de propostas criadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.todayEvents}</div>
            <p className="text-xs text-muted-foreground">Compromissos agendados</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Usuários ativos no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Pipeline ativo vs total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Usuário</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {metrics.activeUsers > 0 ? Math.round(metrics.totalLeads / metrics.activeUsers) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Leads por usuário ativo</p>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div key={performer.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{performer.name}</p>
                      <p className="text-xs text-slate-500">{performer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{performer.score} pts</p>
                    <p className="text-xs text-slate-500">
                      {performer.leads} leads • {performer.proposals} propostas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por estágio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Estágio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.stage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.count}</Badge>
                    <span className="text-xs text-slate-500">
                      {((item.count / metrics.totalLeads) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
