import { useAuth } from '@/contexts/AuthContext';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useMeetingMetrics } from '@/hooks/useMeetingMetrics';

export default function Dashboard() {
  const { profile } = useAuth();
  const { leads, events, pipelineStages, proposals } = useCrm();
  const { completionRate, averageDuration } = useMeetingMetrics(events);

  // Calcular estatísticas
  const totalLeads = leads.length;
  const todayEvents = events.filter(event => {
    const today = new Date().toISOString().split('T')[0];
    return event.date === today;
  }).length;

  // Calcular leads por estágio
  const leadsByStage = pipelineStages.map(stage => ({
    ...stage,
    count: leads.filter(lead => lead.pipeline_stage === stage.id).length
  }));

  // Calcular valor total das propostas enviadas
  const proposalsSentLeads = leads.filter(lead => 
    lead.pipeline_stage === 'proposta_enviada' && lead.proposal_id
  );
  
  const totalProposalValue = proposalsSentLeads.reduce((sum, lead) => {
    const proposal = proposals.find(p => p.id === lead.proposal_id);
    return sum + (proposal?.total_value || 0);
  }, 0);

  // Estatísticas de conversão
  const conversionRate = totalLeads > 0 ? 
    (leads.filter(lead => lead.pipeline_stage === 'fechado').length / totalLeads * 100).toFixed(1) : '0';

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Bem-vindo, {profile?.name || 'Usuário'}!
        </h1>
        <p className="text-slate-600">
          Aqui está um resumo das suas atividades hoje
        </p>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Leads cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEvents}</div>
            <p className="text-xs text-muted-foreground">
              Reuniões e compromissos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Leads convertidos em vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Propos.</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalProposalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {proposalsSentLeads.length} propostas enviadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pipeline de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadsByStage.map(stage => (
                <div key={stage.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="text-sm font-medium">{stage.name}</span>
                  </div>
                  <Badge variant="secondary">{stage.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Métricas de Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Conclusão</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-bold">{completionRate}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Duração Média</span>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="font-bold">{averageDuration} min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eventos próximos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.slice(0, 5).length > 0 ? (
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-slate-600">
                      {event.date} às {event.time} - {event.company}
                    </div>
                  </div>
                  <Badge variant={event.completed ? "default" : "secondary"}>
                    {event.completed ? "Concluído" : "Pendente"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-4">
              Nenhum evento próximo encontrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
