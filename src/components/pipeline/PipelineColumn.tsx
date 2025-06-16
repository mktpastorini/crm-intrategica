
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Archive, Building, Phone, Mail, User, FileText, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Lead, PipelineStage } from './types';
import { proposalService } from '@/services/proposalService';

interface Props {
  stage: PipelineStage;
  leads: Lead[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onLeadUpdate?: (leadId: string, updates: Partial<Lead>) => void;
}

export default function PipelineColumn({
  stage,
  leads,
  onDragOver,
  onDrop,
  onDragStart,
  onLeadUpdate,
}: Props) {
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const { toast } = useToast();

  // Buscar propostas
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: proposalService.getAll,
  });

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    // Verificar se está tentando mover para "Proposta Enviada"
    const isPropostaEnviadaStage = stage.name.toLowerCase().includes('proposta') && 
                                   stage.name.toLowerCase().includes('enviada');
    
    if (isPropostaEnviadaStage) {
      e.preventDefault();
      const leadId = e.dataTransfer.getData('text/plain');
      
      // Buscar o lead pelos leads fornecidos na props
      const lead = leads.find(l => l.id === leadId);
      
      if (!lead) {
        // Se não encontrou nos leads desta coluna, buscar em todas as colunas
        const allLeads = document.querySelectorAll('[data-lead-id]');
        let foundLead = null;
        
        allLeads.forEach(element => {
          const elementLeadId = element.getAttribute('data-lead-id');
          if (elementLeadId === leadId) {
            const leadName = element.querySelector('.lead-name')?.textContent || '';
            const leadCompany = element.querySelector('.lead-company')?.textContent || '';
            const leadPhone = element.querySelector('.lead-phone')?.textContent || '';
            const leadEmail = element.querySelector('.lead-email')?.textContent || '';
            
            foundLead = {
              id: leadId,
              name: leadName,
              company: leadCompany,
              phone: leadPhone,
              email: leadEmail,
              niche: '',
              responsible_id: '',
              created_at: '',
              pipeline_stage: ''
            } as Lead;
          }
        });

        if (!foundLead) {
          toast({
            title: "Erro",
            description: "Lead não encontrado. Tente recarregar a página.",
            variant: "destructive",
          });
          return;
        }

        // Se o lead não tem proposta vinculada, mostrar dialog
        if (!foundLead.proposal_id) {
          setSelectedLead(foundLead);
          setShowProposalDialog(true);
          return;
        }
      } else {
        // Se o lead não tem proposta vinculada, mostrar dialog
        if (!lead.proposal_id) {
          setSelectedLead(lead);
          setShowProposalDialog(true);
          return;
        }
      }
    }
    
    // Continuar com drop normal para outros estágios
    onDrop(e, stageId);
  };

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
      
      // Atualizar o lead localmente se callback disponível
      if (onLeadUpdate) {
        onLeadUpdate(selectedLead.id, { proposal_id: selectedProposalId });
      }

      // Executar o drop para mover o lead
      const mockEvent = {
        preventDefault: () => {},
        dataTransfer: {
          getData: () => selectedLead.id
        }
      } as any;
      
      onDrop(mockEvent, stage.id);

      toast({
        title: "Sucesso",
        description: "Proposta vinculada e lead movido com sucesso",
      });

      // Reset
      setSelectedLead(null);
      setSelectedProposalId('');
      setShowProposalDialog(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao vincular proposta",
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

  return (
    <>
      <div
        className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full"
        onDragOver={onDragOver}
        onDrop={(e) => handleDrop(e, stage.id)}
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
          {leads.map(lead => (
            <Card
              key={lead.id}
              className="cursor-move hover:shadow-md transition-shadow bg-white border border-slate-200"
              draggable
              onDragStart={(e) => onDragStart(e, lead.id)}
              data-lead-id={lead.id}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-900 lead-name">{lead.name}</CardTitle>
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
                  <div className="bg-green-50 p-2 rounded border border-green-200">
                    <div className="flex items-center text-xs text-green-700">
                      <FileText className="w-3 h-3 mr-1" />
                      {getProposalTitle(lead.proposal_id)}
                    </div>
                    <div className="flex items-center text-xs font-medium text-green-800">
                      <DollarSign className="w-3 h-3 mr-1" />
                      R$ {getProposalValue(lead.proposal_id).toFixed(2)}
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
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 h-6 w-6 p-0">
                    <Archive className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {leads.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">Nenhum lead neste estágio</div>
          )}
        </div>
      </div>

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
                      {proposal.title} - R$ {proposal.total_value.toFixed(2)}
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
    </>
  );
}
