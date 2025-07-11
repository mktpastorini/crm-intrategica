import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Users, BarChart3, Zap, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCrm } from '@/contexts/CrmContext';
import PipelineColumn from '@/components/pipeline/PipelineColumn';
import UnknownStageColumn from '@/components/pipeline/UnknownStageColumn';
import { Lead } from '@/components/pipeline/types';
import { triggerJourneyMessages } from '@/utils/journeyTriggerService';

export default function Pipeline() {
  const { 
    leads, 
    pipelineStages, 
    updateLead, 
    addLead,
    deleteLead
  } = useCrm();
  const { toast } = useToast();
  const [filter, setFilter] = useState('');

  const pipelineLeads: Lead[] = leads.map(lead => ({
    ...lead,
    pipeline_stage: lead.pipeline_stage || 'prospeccao'
  }));

  const filteredLeads = pipelineLeads.filter(lead => 
    lead.name.toLowerCase().includes(filter.toLowerCase()) ||
    lead.company.toLowerCase().includes(filter.toLowerCase()) ||
    lead.email?.toLowerCase().includes(filter.toLowerCase()) ||
    lead.phone.includes(filter)
  );

  const getLeadsByStage = (stageId: string) => {
    return filteredLeads.filter(lead => lead.pipeline_stage === stageId);
  };

  const getUnknownStageLeads = () => {
    const knownStageIds = pipelineStages.map(stage => stage.id);
    return filteredLeads.filter(lead => !knownStageIds.includes(lead.pipeline_stage));
  };

  // Calcular métricas do pipeline
  const getTotalPipelineValue = () => {
    return filteredLeads.reduce((total, lead) => {
      // Assumindo um valor médio por lead se não houver proposta
      return total + (lead.proposal_id ? 5000 : 2000); // Valores exemplares
    }, 0);
  };

  const getConversionRate = () => {
    const totalLeads = filteredLeads.length;
    const convertedLeads = filteredLeads.filter(lead => 
      lead.pipeline_stage === 'fechado' || lead.pipeline_stage === 'vendido'
    ).length;
    return totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    console.log('onDragEnd chamado:', { destination, source, draggableId });

    if (!destination) {
      console.log('Sem destino - cancelando');
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      console.log('Mesma posição - cancelando');
      return;
    }

    const leadId = draggableId;
    const newStageId = destination.droppableId;
    const oldStageId = source.droppableId;

    console.log(`Tentando mover lead ${leadId} de ${oldStageId} para ${newStageId}`);

    try {
      const lead = pipelineLeads.find(l => l.id === leadId);
      if (!lead) {
        console.error('Lead não encontrado:', leadId);
        toast({
          title: "Erro",
          description: "Lead não encontrado. Tente recarregar a página.",
          variant: "destructive",
        });
        return;
      }

      const newStage = pipelineStages.find(s => s.id === newStageId);
      const oldStage = pipelineStages.find(s => s.id === oldStageId);
      
      console.log('Informações dos estágios:', { 
        newStage: newStage?.name, 
        oldStage: oldStage?.name,
        leadName: lead.name 
      });

      const canMove = await checkSpecialStageConditions(lead, newStageId, newStage?.name || '');
      
      if (!canMove) {
        console.log('Movimento bloqueado pelas condições especiais');
        return;
      }

      console.log('Atualizando lead no banco...');
      await updateLead(leadId, { pipeline_stage: newStageId });
      console.log('Lead atualizado com sucesso');

      console.log('Disparando mensagens da jornada...');
      await triggerJourneyMessages({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        pipeline_stage: newStageId
      }, newStageId);

      const stageName = newStage?.name || newStageId;
      
      toast({
        title: "Lead movido",
        description: `${lead.name} foi movido para ${stageName}`,
      });

      console.log('Movimento concluído com sucesso');
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: "Erro ao mover lead",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const checkSpecialStageConditions = async (lead: Lead, newStageId: string, stageName: string): Promise<boolean> => {
    console.log('Verificando condições especiais:', { leadName: lead.name, stageName });

    if (stageName.toLowerCase().includes('reunião') || stageName.toLowerCase().includes('reuniao')) {
      console.log('Estágio de reunião detectado - verificação obrigatória de evento agendado');
      
      toast({
        title: "Evento necessário",
        description: "Para mover para 'Reunião', é obrigatório ter um evento agendado para este lead.",
        variant: "destructive",
      });
      
      return false;
    }

    return true;
  };

  const handleAddLead = () => {
    const newLead: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
      name: 'Novo Lead',
      email: '',
      phone: '',
      company: '',
      niche: '',
      status: 'novo',
      pipeline_stage: pipelineStages[0]?.id || 'prospeccao',
      responsible_id: '',
      address: '',
      whatsapp: '',
      instagram: '',
      website: '',
      place_id: '',
      rating: undefined,
      proposal_id: undefined
    };

    addLead(newLead as any);
    
    toast({
      title: "Lead criado",
      description: "Um novo lead foi adicionado ao pipeline",
    });
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    try {
      await deleteLead(leadId);
      toast({
        title: "Lead excluído",
        description: "Lead foi removido com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir lead",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('Pipeline renderizado:', {
      totalLeads: pipelineLeads.length,
      totalStages: pipelineStages.length,
      filteredLeads: filteredLeads.length
    });
  }, [pipelineLeads.length, pipelineStages.length, filteredLeads.length]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="flex-shrink-0 bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/30 border-b border-slate-200/50 shadow-sm backdrop-blur-sm">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Pipeline de Vendas
                  </h2>
                  <p className="text-slate-600">Gerencie seus leads através do funil de vendas</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleAddLead} 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Leads</p>
                    <p className="text-xl font-bold text-blue-800">{filteredLeads.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100/50 border-green-200/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Taxa Conversão</p>
                    <p className="text-xl font-bold text-green-800">{getConversionRate()}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Pipeline Value</p>
                    <p className="text-xl font-bold text-purple-800">
                      R$ {getTotalPipelineValue().toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-yellow-100/50 border-amber-200/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Estágios Ativos</p>
                    <p className="text-xl font-bold text-amber-800">{pipelineStages.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Filtrar leads por nome, empresa, email ou telefone..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm transition-all"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white/80 px-4 py-3 rounded-xl shadow-sm backdrop-blur-sm">
              <Users className="w-4 h-4" />
              <span className="font-medium">{filteredLeads.length} leads filtrados</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full overflow-x-auto bg-gradient-to-br from-slate-50/50 to-transparent">
            <div className="flex gap-6 px-6 py-6 min-h-full min-w-max">
              {pipelineStages.map((stage, index) => (
                <div key={stage.id} className="relative">
                  {index < pipelineStages.length - 1 && (
                    <div className="absolute top-16 -right-3 w-6 h-0.5 bg-gradient-to-r from-slate-300 to-slate-200 z-10" />
                  )}
                  <PipelineColumn
                    stage={stage}
                    leads={getLeadsByStage(stage.id)}
                    onDeleteLead={handleDeleteLead}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e, stageId) => {
                      e.preventDefault();
                      console.log('onDrop chamado mas será gerenciado pelo DragDropContext');
                    }}
                    onDragStart={(e, leadId) => {
                      console.log('onDragStart chamado:', leadId);
                      e.dataTransfer.setData('text/plain', leadId);
                    }}
                    allLeads={pipelineLeads}
                  />
                </div>
              ))}
              
              {getUnknownStageLeads().length > 0 && (
                <UnknownStageColumn
                  leads={getUnknownStageLeads()}
                  onDeleteLead={handleDeleteLead}
                />
              )}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
