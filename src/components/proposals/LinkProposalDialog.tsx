
import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface LinkProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: any;
}

export default function LinkProposalDialog({ open, onOpenChange, proposal }: LinkProposalDialogProps) {
  const { leads, linkProposalToLead, actionLoading } = useCrm();
  const { toast } = useToast();
  const [selectedLeadId, setSelectedLeadId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLeadId) {
      toast({
        title: "Selecione um lead",
        description: "É necessário selecionar um lead para vincular a proposta",
        variant: "destructive",
      });
      return;
    }

    try {
      await linkProposalToLead(selectedLeadId, proposal.id);
      onOpenChange(false);
      setSelectedLeadId('');
    } catch (error) {
      console.error('Erro ao vincular proposta:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Filter leads that don't have a proposal already linked
  const availableLeads = leads.filter(lead => !lead.proposal_id);

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vincular Proposta ao Lead</DialogTitle>
          <DialogDescription>
            Selecione um lead para vincular esta proposta
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-md">
            <h3 className="font-medium text-slate-900">{proposal.title}</h3>
            <p className="text-lg font-bold text-green-600 mt-1">
              {formatCurrency(proposal.total_value)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="lead">Selecionar Lead *</Label>
              {availableLeads.length === 0 ? (
                <div className="p-3 text-center text-slate-500 bg-slate-50 rounded-md">
                  Todos os leads já possuem propostas vinculadas
                </div>
              ) : (
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLeads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{lead.name}</span>
                          <span className="text-xs text-slate-500">
                            {lead.company} • {lead.phone}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={actionLoading !== null}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={actionLoading !== null || availableLeads.length === 0}
              >
                Vincular Proposta
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
