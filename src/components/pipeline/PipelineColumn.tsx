import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archive, Building, Phone, Mail, User, FileText, DollarSign, Edit, Calendar, TrendingUp, Clock, Star } from 'lucide-react';
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
  onDrop,
  onDragStart,
  allLeads = [],
}: Props) {
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [showEditProposalDialog, setShowEditProposalDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
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

  const handleScheduleEvent = async () => {
    if (!selectedLead) {
      toast({
        title: "Erro",
        description: "Lead não selecionado",
        variant: "destructive",
      });
      return;
    }

    // Por enquanto, simular o agendamento do evento
    toast({
      title: "Evento agendado",
      description: `Reunião agendada para ${selectedLead.name}. Funcionalidade completa será implementada.`,
    });

    // Reset
    setSelectedLead(null);
    setShowEventDialog(false);
  };

  const getProposalValue = (proposalId: string): number => {
    const proposal = proposals.find(p => p.id === proposalId);
    return proposal?.total_value || 0;
  };

  const getProposalTitle = (proposalId: string): string => {
    const proposal = proposals.find(p => p.id === proposalId);
    return proposal?.title || 'Proposta';
  };

  // Função para calcular valor total do estágio
  const getTotalStageValue = () => {
    return leads.reduce((total, lead) => {
      if (lead.proposal_id) {
        return total + getProposalValue(lead.proposal_id);
      }
      return total;
    }, 0);
  };

  // Função para obter ícone baseado no nicho
  const getNicheIcon = (niche: string) => {
    const nicheMap: { [key: string]: any } = {
      'tecnologia': '💻',
      'educação': '🎓',
      'saúde': '🏥',
      'construção': '🏗️',
      'varejo': '🛍️',
      'serviços': '⚙️',
    };
    return nicheMap[niche.toLowerCase()] || '🏢';
  };

  // Função para obter prioridade visual baseada no valor
  const getLeadPriority = (lead: Lead) => {
    const value = lead.proposal_id ? getProposalValue(lead.proposal_id) : 0;
    if (value > 10000) return 'high';
    if (value > 5000) return 'medium';
    return 'normal';
  };

  const checkSpecialStageRequirements = (leadId: string, targetStageId: string): boolean => {
    const lead = leads.find(l => l.id === leadId) || allLeads.find(l => l.id === leadId);
    if (!lead) return false;

    const targetStage = stage;
    const stageName = targetStage.name.toLowerCase();

    // Condição especial para "Reunião" - deve ter evento agendado
    if (stageName.includes('reunião') || stageName.includes('reuniao')) {
      // Por enquanto, sempre mostrar o diálogo para agendar
      setSelectedLead(lead);
      setShowEventDialog(true);
      return false;
    }

    // Condição especial para "Proposta Enviada" - deve ter proposta vinculada
    if (stageName.includes('proposta') && stageName.includes('enviada')) {
      if (!lead.proposal_id) {
        setSelectedLead(lead);
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
            className={`flex-shrink-0 w-80 rounded-xl shadow-lg border border-slate-200/50 flex flex-col h-full transition-all duration-300 ${
              snapshot.isDraggingOver 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 shadow-xl scale-[1.02] ring-2 ring-blue-200' 
                : 'bg-gradient-to-br from-white to-slate-50/30 hover:shadow-xl'
            }`}
          >
            {/* Header melhorado com gradiente e estatísticas */}
            <div 
              className="relative p-4 border-b border-slate-100/50 flex-shrink-0 rounded-t-xl"
              style={{
                background: `linear-gradient(135deg, ${stage.color}15 0%, ${stage.color}25 100%)`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-bold text-slate-900 text-sm tracking-wide">
                    {stage.name}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className="text-xs font-semibold bg-white/80 text-slate-700 shadow-sm"
                  >
                    {leads.length}
                  </Badge>
                </div>
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              
              {/* Estatísticas do estágio */}
              {getTotalStageValue() > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-green-700 bg-green-100/50 px-2 py-1 rounded-full">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-semibold">
                      R$ {getTotalStageValue().toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  {leads.filter(l => l.proposal_id).length > 0 && (
                    <div className="flex items-center gap-1 text-blue-700 bg-blue-100/50 px-2 py-1 rounded-full">
                      <FileText className="w-3 h-3" />
                      <span>{leads.filter(l => l.proposal_id).length} propostas</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Barra de progresso visual */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-200/50 to-transparent" />
            </div>

            {/* Conteúdo com cards melhorados */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {leads.map((lead, index) => (
                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`cursor-move transition-all duration-300 group ${
                        snapshot.isDragging 
                          ? 'shadow-2xl rotate-2 scale-105 ring-4 ring-blue-200/50 bg-white z-50' 
                          : 'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1'
                      } ${
                        getLeadPriority(lead) === 'high' 
                          ? 'ring-2 ring-amber-200 bg-gradient-to-br from-amber-50 to-white' 
                          : getLeadPriority(lead) === 'medium'
                          ? 'ring-1 ring-blue-200 bg-gradient-to-br from-blue-50/30 to-white'
                          : 'bg-gradient-to-br from-white to-slate-50/30'
                      } border border-slate-200/50`}
                      style={{
                        ...provided.draggableProps.style,
                        transform: provided.draggableProps.style?.transform || 'none'
                      }}
                    >
                      <CardHeader className="pb-3 relative">
                        {/* Indicador de prioridade */}
                        {getLeadPriority(lead) === 'high' && (
                          <div className="absolute top-2 right-2">
                            <Star className="w-4 h-4 text-amber-500 fill-current" />
                          </div>
                        )}
                        
                        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2 lead-name">
                          <span className="text-lg">{getNicheIcon(lead.niche)}</span>
                          {lead.name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="pt-0 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center text-xs text-slate-600 bg-slate-50/50 px-2 py-1 rounded-md">
                            <Building className="w-3 h-3 mr-2 text-slate-400" />
                            <span className="lead-company font-medium">{lead.company}</span>
                          </div>
                          
                          <div className="flex items-center text-xs text-slate-600 bg-slate-50/50 px-2 py-1 rounded-md">
                            <Phone className="w-3 h-3 mr-2 text-green-500" />
                            <span className="lead-phone">{lead.phone}</span>
                          </div>
                          
                          {lead.email && (
                            <div className="flex items-center text-xs text-slate-600 bg-slate-50/50 px-2 py-1 rounded-md">
                              <Mail className="w-3 h-3 mr-2 text-blue-500" />
                              <span className="lead-email">{lead.email}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Proposta vinculada com design melhorado */}
                        {lead.proposal_id && (
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100/20 rounded-full -translate-y-8 translate-x-8" />
                            <div className="flex items-center justify-between relative">
                              <div className="space-y-1">
                                <div className="flex items-center text-xs text-emerald-700 font-medium">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {getProposalTitle(lead.proposal_id)}
                                </div>
                                <div className="flex items-center text-sm font-bold text-emerald-800">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  R$ {getProposalValue(lead.proposal_id).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/50 transition-colors"
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

                        {/* Footer com badges e ações */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 text-slate-700"
                            >
                              {lead.niche}
                            </Badge>
                            {lead.updated_at && (
                              <div className="flex items-center text-xs text-slate-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(lead.updated_at).toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit' 
                                })}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <div className="flex items-center text-xs text-slate-500 bg-slate-100/50 px-2 py-1 rounded-full">
                              <User className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-16">{lead.responsible_id}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-7 w-7 p-0 transition-colors opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLead(lead.id);
                              }}
                            >
                              <Archive className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {/* Estado vazio melhorado */}
              {leads.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">Nenhum lead neste estágio</p>
                  <p className="text-xs text-slate-300 mt-1">Arraste leads para cá</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Droppable>

      {/* Dialog para vincular proposta (obrigatório para Proposta Enviada) */}
      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Proposta Obrigatória</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Lead: <strong>{selectedLead?.name}</strong> - {selectedLead?.company}
              </p>
              <p className="text-sm text-orange-600 mb-4 font-medium">
                ⚠️ Para mover este lead para "Proposta Enviada", é OBRIGATÓRIO vincular uma proposta.
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
              <Button onClick={handleProposalLink} disabled={!selectedProposalId}>
                Vincular e Mover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Reunião Obrigatória</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Lead: <strong>{selectedLead?.name}</strong> - {selectedLead?.company}
              </p>
              <p className="text-sm text-orange-600 mb-4 font-medium">
                ⚠️ Para mover este lead para "Reunião", é OBRIGATÓRIO agendar um evento/reunião.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <div className="flex items-center text-blue-700 mb-2">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="font-medium">Agendar Reunião</span>
              </div>
              <p className="text-sm text-blue-600">
                Funcionalidade de agendamento será implementada. Por enquanto, confirme para simular o agendamento.
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleScheduleEvent}>
                Agendar e Mover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
