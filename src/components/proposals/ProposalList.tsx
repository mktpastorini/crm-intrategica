
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Proposal } from '@/types/proposal';
import { Lead } from '@/components/pipeline/types';
import { FileText, Pencil, X, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProposalListProps {
  proposals: Proposal[];
  leads: Lead[];
  onEdit: (proposal: Proposal) => void;
  onDelete: (id: string) => void;
  onLinkToLead: (proposalId: string, leadId: string) => void;
}

export default function ProposalList({
  proposals,
  leads,
  onEdit,
  onDelete,
  onLinkToLead
}: ProposalListProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const { toast } = useToast();

  const handleLinkToLead = () => {
    if (!selectedProposal || !selectedLeadId) {
      toast({
        title: "Erro",
        description: "Selecione um lead para vincular",
        variant: "destructive",
      });
      return;
    }

    onLinkToLead(selectedProposal.id, selectedLeadId);
    setShowLinkDialog(false);
    setSelectedProposal(null);
    setSelectedLeadId('');
    
    toast({
      title: "Sucesso",
      description: "Proposta vinculada ao lead com sucesso",
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Tem certeza que deseja excluir a proposta "${title}"?`)) {
      onDelete(id);
      toast({
        title: "Sucesso",
        description: "Proposta excluída com sucesso",
      });
    }
  };

  const openLinkDialog = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowLinkDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Propostas Criadas</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <CardTitle className="text-sm">{proposal.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xl font-bold text-green-600">
                R$ {proposal.total_value.toFixed(2)}
              </div>
              
              <div className="text-xs text-slate-500">
                Criada em {format(new Date(proposal.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </div>

              {proposal.content && (
                <p className="text-sm text-slate-600 line-clamp-3">
                  {proposal.content.replace(/\{\{[^}]+\}\}/g, '[VARIÁVEL]')}
                </p>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLinkDialog(proposal)}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Vincular
                </Button>
                
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(proposal)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(proposal.id, proposal.title)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Proposta ao Lead</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Proposta: <strong>{selectedProposal?.title}</strong>
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Valor: <strong>R$ {selectedProposal?.total_value.toFixed(2)}</strong>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Selecionar Lead:</label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Escolha um lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleLinkToLead}>
                Vincular
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
