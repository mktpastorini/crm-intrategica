
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archive, Building, Phone, Mail, User, FileText, DollarSign, Edit } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Lead, PipelineStage } from './types';
import { proposalService } from '@/services/proposalService';
import { useCrm } from '@/contexts/CrmContext';
import { Droppable, Draggable } from '@hello-pangea/dnd';

interface Props {
  stage: PipelineStage;
  leads: Lead[];
  onDeleteLead: (leadId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  allLeads?: Lead[];
}

export default function PipelineColumn({
  stage,
  leads,
  onDeleteLead,
  onDragOver,
  onD

,
  onDragStart,
  allLeads = [],
}: Props) {
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [showEditProposalDialog, setShowEditProposalDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const { toast } = useToast();
  const { updateLead } = useCrm();

  // Buscar propostas
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: proposalService.getAll,
  });

  const handleProposalLink = async () => {
    if (!selectedLead || !selectedProposalId) {
      toast({
        title: "Erro",
        description: "Selecione uma proposta para vincular",
        variant: "destructive",
      });
      return;
    }

    try {
      // Vincular proposta ao lead
      await proposalService.linkToLead(selectedProposalId, selectedLead.id);
      
      // Atualizar o lead localmente
      await updateLead(selectedLead.id, { proposal_id: selectedProposalId } as any);

      toast({
        title: "Sucesso",
        description: "Proposta vinculada com sucesso",
      });

      // Reset
      setSelectedLead(null);
      setSelectedProposalId('');
      setShowProposalDialog(false);
    } catch (error) {
      console.error('Erro ao vincular proposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao vincular proposta",
        variant: "destructive",
      });
    }
  };

  const handleEditProposal = (lead: Lead) => {
    setSelectedLead(lead);
    setSelectedProposalId(lead.proposal_id || '');
    setShowEditProposalDialog(true);
  };

  const handleUpdateProposal = async () => {
    if (!selectedLead) {
      toast({
        title: "Erro",
        description: "Lead não selecionado",
        variant: "destructive",
      });
      return;
    }

    try {
      // Atualizar a proposta vinculada ao lead
      await updateLead(selectedLead.id, { proposal_id: selectedProposalId || undefined } as any);

      toast({
        title: "Sucesso",
        description: selectedProposalId ? "Proposta atualizada com sucesso" : "Proposta removida com sucesso",
      });

      // Reset
      setSelectedLead(null);
      setSelectedProposalId('');
      setShowEditProposalDialog(false);
    } catch (error) {
      console.error('Erro ao atualizar proposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar proposta",
        variant: "destructive",
      });
    }
  };

  const getProposalValue = (proposalId: string): number => {
    const proposal = proposals.find(p => p.id === proposalId);
    return proposal?.total_value || 0;
  };

  const getProposalTitle = (proposalId: string): string => {
    const proposal = proposals.find(p => p.id === proposalId);
    return proposal?.title || 'Proposta';
  };

  const checkProposalRequirement = (leadId: string): boolean => {
    const isPropostaEnviadaStage = stage.name.toLowerCase().includes('proposta') && 
                                   stage.name.toLowerCase().includes('enviada');
    
    if (isPropostaEnviadaStage) {
      const lead = leads.find(l => l.id === leadId) || allLeads.find(l => l.id === leadId);
      if (!lead?.proposal_id) {
        setSelectedLead(lead || null);
        setShowProposalDialog(true);
        return false;
      }
    }
    
    return true;
  };

  return (
    <>
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full ${
              snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : ''
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <h3 className="font-semibold text-slate-900 text-sm">{stage.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {leads.length}
                </Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {leads.map((lead, index) => (
                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`cursor-move transition-all duration-200 bg-white border border-slate-200 ${
                        snapshot.isDragging 
                          ? 'shadow-lg rotate-3 scale-105 ring-2 ring-blue-400' 
                          : 'hover:shadow-md'
                      }`}
                      style={{
                        ...provided.draggableProps.style,
                        transform: provided.draggableProps.style?.transform || 'none'
                      }}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-900 lead-name">
                          {lead.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex items-center text-xs text-slate-600">
                          <Building className="w-3 h-3 mr-1" />
                          <span className="lead-company">{lead.company}</span>
                        </div>
                        <div className="flex items-center text-xs text-slate-600">
                          <Phone className="w-3 h-3 mr-1" />
                          <span className="lead-phone">{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="flex items-center text-xs text-slate-600">
                            <Mail className="w-3 h-3 mr-1" />
                            <span className="lead-email">{lead.email}</span>
                          </div>
                        )}
                        
                        {/* Mostrar proposta vinculada se existir */}
                        {lead.proposal_id && (
                          <div className="bg-green-50 p-2 rounded border border-green-200 relative">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center text-xs text-green-700">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {getProposalTitle(lead.proposal_id)}
                                </div>
                                <div className="flex items-center text-xs font-medium text-green-800">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  R$ {getProposalValue(lead.proposal_id).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProposal(lead);
                                }}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <Badge variant="outline" className="text-xs">
                            {lead.niche}
                          </Badge>
                          <div className="flex items-center text-xs text-slate-500">
                            <User className="w-3 h-3 mr-1" />
                            {lead.responsible_id}
                          </div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-slate-400 hover:text-slate-600 h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLead(lead.id);
                            }}
                          >
                            <Archive className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {leads.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum lead neste estágio
                </div>
              )}
            </div>
          </div>
        )}
      </Droppable>

      {/* Dialog para vincular proposta */}
      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Proposta ao Lead</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Lead: <strong>{selectedLead?.name}</strong> - {selectedLead?.company}
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Para mover este lead para "Proposta Enviada", é necessário vincular uma proposta.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Selecionar Proposta:</label>
              <Select value={selectedProposalId} onValueChange={setSelectedProposalId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Escolha uma proposta" />
                </SelectTrigger>
                <SelectContent>
                  {proposals.map((proposal) => (
                    <SelectItem key={proposal.id} value={proposal.id}>
                      {proposal.title} - R$ {proposal.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowProposalDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleProposalLink}>
                Vincular e Mover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar proposta vinculada */}
      <Dialog open={showEditProposalDialog} onOpenChange={setShowEditProposalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Proposta Vinculada</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Lead: <strong>{selectedLead?.name}</strong> - {selectedLead?.company}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Selecionar Nova Proposta:</label>
              <Select value={selectedProposalId} onValueChange={setSelectedProposalId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Escolha uma proposta ou deixe vazio para remover" />
                </SelectTrigger>
                <SelectContent>
                  {proposals.map((proposal) => (
                    <SelectItem key={proposal.id} value={proposal.id}>
                      {proposal.title} - R$ {proposal.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProposalId('')}
                  className="text-xs"
                >
                  Remover proposta
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditProposalDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateProposal}>
                Atualizar Proposta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
