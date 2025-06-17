
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, FileText, Calendar, Target, Award } from 'lucide-react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export default function UserDashboard() {
  const { leads, events, pipelineStages } = useCrm();
  const { user } = useAuth();

  // Filtra dados apenas do usuário atual
  const userLeads = useMemo(() => {
    return leads.filter(lead => lead.responsible_id === user?.id);
  }, [leads, user?.id]);

  const userEvents = useMemo(() => {
    return events.filter(event => event.responsible_id === user?.id);
  }, [events, user?.id]);

  // Calcula métricas específicas do usuário
  const userMetrics = useMemo(() => {
    // Pipeline Ativo: todos os leads exceto "Aguardando Contato" (primeiro) e "Perdidos" (último)
    const firstStageId = pipelineStages.find(s => s.order === 0)?.id || 'aguardando_contato';
    const lastStageId = pipelineStages.find(s => s.name.toLowerCase().includes('perdido'))?.id;
    
    const activePipelineLeads = userLeads.filter(lead => 
      lead.pipeline_stage !== firstStageId && 
      (!lastStageId || lead.pipeline_stage !== lastStageId)
    );

    const totalLeads = userLeads.length;
    const activeInPipeline = activePipelineLeads.length;
    const waitingContact = userLeads.filter(lead => lead.pipeline_stage === firstStageId).length;
    const lostLeads = lastStageId ? userLeads.filter(lead => lead.pipeline_stage === lastStageId).length : 0;

    // Eventos de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayEvents = userEvents.filter(event => event.date === today);
    
    // Propostas do usuário (leads com proposta vinculada)
    const leadsWithProposals = userLeads.filter(lead => lead.proposal_id);

    return {
      totalLeads,
      activeInPipeline,
      waitingContact,
      lostLeads,
      todayEvents: todayEvents.length,
      proposals: leadsWithProposals.length,
      conversionRate: totalLeads > 0 ? ((activeInPipeline / totalLeads) * 100).toFixed(1) : '0'
    };
  }, [userLeads, userEvents, pipelineStages]);

  // Distribuição por estágio
  const stageDistribution = useMemo(() => {
    return pipelineStages.map(stage => {
      const stageLeads = userLeads.filter(lead => lead.pipeline_stage === stage.id);
      return {
        stage: stage.name,
        count: stageLeads.length,
        color: stage.color
      };
    }).filter(item => item.count > 0);
  }, [userLeads, pipelineStages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Meu Dashboard</h2>
        <Badge variant="outline" className="text-sm">
          Usuário: {user?.email}
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
            <div className="text-2xl font-bold">{userMetrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Leads sob sua responsabilidade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Ativo</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{userMetrics.activeInPipeline}</div>
            <p className="text-xs text-muted-foreground">Leads em processo ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propostas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userMetrics.proposals}</div>
            <p className="text-xs text-muted-foreground">Leads com propostas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{userMetrics.todayEvents}</div>
            <p className="text-xs text-muted-foreground">Compromissos agendados</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Contato</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{userMetrics.waitingContact}</div>
            <p className="text-xs text-muted-foreground">Leads para iniciar contato</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{userMetrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Leads ativos vs total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Perdidos</CardTitle>
            <Award className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{userMetrics.lostLeads}</div>
            <p className="text-xs text-muted-foreground">Oportunidades não convertidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por estágio */}
      {stageDistribution.length > 0 && (
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
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
