
import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Users } from 'lucide-react';
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

  // Convert CRM leads to pipeline leads format
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

      // Verificar condições especiais antes de mover
      const canMove = await checkSpecialStageConditions(lead, newStageId, newStage?.name || '');
      
      if (!canMove) {
        console.log('Movimento bloqueado pelas condições especiais');
        return;
      }

      // Atualizar o lead no banco
      console.log('Atualizando lead no banco...');
      await updateLead(leadId, { pipeline_stage: newStageId });
      console.log('Lead atualizado com sucesso');

      // Disparar mensagens da jornada do cliente
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

  // Função para verificar condições especiais dos estágios
  const checkSpecialStageConditions = async (lead: Lead, newStageId: string, stageName: string): Promise<boolean> => {
    console.log('Verificando condições especiais:', { leadName: lead.name, stageName });

    // Condição especial para "Reunião" - deve ter evento agendado
    if (stageName.toLowerCase().includes('reunião') || stageName.toLowerCase().includes('reuniao')) {
      // Aqui você pode implementar a verificação se o lead tem reunião agendada
      // Por enquanto, vou permitir o movimento mas com aviso
      console.log('Estágio de reunião detectado - verificar se há evento agendado');
      
      toast({
        title: "Atenção",
        description: "Certifique-se de que há uma reunião agendada para este lead.",
      });
      
      return true;
    }

    // Condição especial para "Proposta Enviada" - deve ter proposta vinculada
    if (stageName.toLowerCase().includes('proposta') && stageName.toLowerCase().includes('enviada')) {
      if (!lead.proposal_id) {
        console.log('Lead sem proposta vinculada para estágio Proposta Enviada');
        
        toast({
          title: "Proposta necessária",
          description: "Para mover para 'Proposta Enviada', é necessário vincular uma proposta ao lead.",
          variant: "destructive",
        });
        
        return false;
      }
      
      console.log('Lead tem proposta vinculada, pode mover para Proposta Enviada');
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

  // Log para debug
  useEffect(() => {
    console.log('Pipeline renderizado:', {
      totalLeads: pipelineLeads.length,
      totalStages: pipelineStages.length,
      filteredLeads: filteredLeads.length
    });
  }, [pipelineLeads.length, pipelineStages.length, filteredLeads.length]);

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-shrink-0 p-6 bg-white border-b shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Pipeline de Vendas</h2>
            <p className="text-slate-600">Gerencie seus leads através do funil de vendas</p>
          </div>
          <Button onClick={handleAddLead} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filtrar leads..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>{filteredLeads.length} leads</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="h-full overflow-x-auto">
            <div className="flex gap-6 px-6 py-6 min-h-full">
              {pipelineStages.map((stage) => (
                <PipelineColumn
                  key={stage.id}
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
