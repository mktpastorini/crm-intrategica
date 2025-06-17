
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

  const filteredLeads = leads.filter(lead => 
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

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const leadId = draggableId;
    const newStage = destination.droppableId;
    const oldStage = source.droppableId;

    console.log(`Movendo lead ${leadId} de ${oldStage} para ${newStage}`);

    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        console.error('Lead não encontrado:', leadId);
        toast({
          title: "Erro",
          description: "Lead não encontrado. Tente recarregar a página.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar o lead
      await updateLead(leadId, { pipeline_stage: newStage });

      // Disparar mensagens da jornada do cliente
      await triggerJourneyMessages({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        pipeline_stage: newStage
      }, newStage);

      const stageName = pipelineStages.find(s => s.id === newStage)?.name || newStage;
      
      toast({
        title: "Lead movido",
        description: `${lead.name} foi movido para ${stageName}`,
      });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: "Erro ao mover lead",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
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

    addLead(newLead);
    
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
                    // Drag handling is managed by DragDropContext
                  }}
                  onDragStart={(e, leadId) => {
                    e.dataTransfer.setData('text/plain', leadId);
                  }}
                  allLeads={leads}
                />
              ))}
              
              {getUnknownStageLeads().length > 0 && (
                <UnknownStageColumn
                  leads={getUnknownStageLeads()}
                  pipelineStages={pipelineStages}
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
