
import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, DollarSign, CalendarDays } from 'lucide-react';
import { useMeetingMetrics } from '@/hooks/useMeetingMetrics';
import { supabase } from '@/integrations/supabase/client';
import type { Lead } from '@/components/pipeline/types';

export default function Dashboard() {
  const { leads, events } = useCrm();
  const { user, profile } = useAuth();
  const meetingMetrics = useMeetingMetrics(events);
  const [proposalValue, setProposalValue] = useState(0);
  const [proposalCount, setProposalCount] = useState(0);

  useEffect(() => {
    calculateProposalMetrics();
  }, [leads]);

  const calculateProposalMetrics = async () => {
    try {
      // Buscar leads no estágio "proposta_enviada"
      const leadsWithProposals = (leads as Lead[]).filter(lead => 
        lead.pipeline_stage === 'proposta_enviada' && lead.proposal_id
      );

      setProposalCount(leadsWithProposals.length);

      if (leadsWithProposals.length === 0) {
        setProposalValue(0);
        return;
      }

      // Buscar as propostas vinculadas
      const proposalIds = leadsWithProposals.map(lead => lead.proposal_id).filter(Boolean);
      
      const { data: proposals, error } = await supabase
        .from('proposals')
        .select('total_value')
        .in('id', proposalIds);

      if (error) throw error;

      const total = proposals?.reduce((sum, proposal) => sum + proposal.total_value, 0) || 0;
      setProposalValue(total);
    } catch (error) {
      console.error('Erro ao calcular métricas das propostas:', error);
    }
  };

  // Estatísticas por estágio
  const stageStats = {
    novo: leads.filter(lead => lead.pipeline_stage === 'novo' || lead.pipeline_stage === 'prospeccao').length,
    contato: leads.filter(lead => lead.pipeline_stage === 'aguardando_contato').length,
    reuniao: leads.filter(lead => lead.pipeline_stage === 'reuniao').length,
    proposta: leads.filter(lead => lead.pipeline_stage === 'proposta_enviada').length,
    contrato: leads.filter(lead => lead.pipeline_stage === 'contrato_assinado').length,
    perdido: leads.filter(lead => lead.pipeline_stage === 'perdido').length
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Bem-vindo ao sistema de CRM</p>
      </div>

      {/* Stats Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Leads</p>
                <p className="text-3xl font-bold">{leads.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Reuniões Concluídas</p>
                <p className="text-3xl font-bold">{meetingMetrics.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Propostas Enviadas</p>
                <p className="text-2xl font-bold">
                  {proposalCount} ({proposalValue.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })})
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Eventos Hoje</p>
                <p className="text-3xl font-bold">{meetingMetrics.today}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por Estágio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Pipeline - Distribuição por Estágio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-700">{stageStats.novo}</div>
              <div className="text-sm text-slate-600">Novos</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{stageStats.contato}</div>
              <div className="text-sm text-blue-600">Aguardando Contato</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700">{stageStats.reuniao}</div>
              <div className="text-sm text-yellow-600">Reunião</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{stageStats.proposta}</div>
              <div className="text-sm text-purple-600">Proposta Enviada</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{stageStats.contrato}</div>
              <div className="text-sm text-green-600">Contrato Assinado</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-700">{stageStats.perdido}</div>
              <div className="text-sm text-red-600">Perdidos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.slice(0, 5).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{lead.name}</div>
                    <div className="text-xs text-slate-600">{lead.company}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {lead.pipeline_stage}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-slate-600">
                      {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}
                    </div>
                  </div>
                  <Badge variant={event.completed ? 'default' : 'secondary'} className="text-xs">
                    {event.completed ? 'Concluído' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
