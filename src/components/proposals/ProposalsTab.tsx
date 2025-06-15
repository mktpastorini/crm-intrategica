
import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText, Link, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProposalEditor from './ProposalEditor';
import LinkProposalDialog from './LinkProposalDialog';

export default function ProposalsTab() {
  const { proposals, leads, deleteProposal, actionLoading } = useCrm();
  const { toast } = useToast();
  const [editingProposal, setEditingProposal] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [linkingProposal, setLinkingProposal] = useState(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a proposta "${title}"?`)) {
      await deleteProposal(id);
    }
  };

  const handleEdit = (proposal: any) => {
    setEditingProposal(proposal);
    setShowEditor(true);
  };

  const handleLink = (proposal: any) => {
    setLinkingProposal(proposal);
    setShowLinkDialog(true);
  };

  const handleCloseEditor = () => {
    setEditingProposal(null);
    setShowEditor(false);
  };

  const handleCloseLinkDialog = () => {
    setLinkingProposal(null);
    setShowLinkDialog(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getLinkedLead = (proposalId: string) => {
    return leads.find(lead => lead.proposal_id === proposalId);
  };

  return (
    <div className="space-y-4">
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">Nenhuma proposta criada ainda.</p>
            <p className="text-sm text-slate-500 mt-2">
              Clique em "Criar Proposta" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.map((proposal) => {
            const linkedLead = getLinkedLead(proposal.id);
            return (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg line-clamp-1">
                        {proposal.title}
                      </CardTitle>
                    </div>
                    {linkedLead && (
                      <Badge variant="secondary" className="text-xs">
                        Vinculada
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(proposal.total_value)}
                    </div>
                    
                    {linkedLead && (
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Lead:</span> {linkedLead.name}
                      </div>
                    )}
                    
                    <div className="text-xs text-slate-500">
                      Criada em {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(proposal)}
                        disabled={actionLoading !== null}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLink(proposal)}
                        disabled={actionLoading !== null}
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(proposal.id, proposal.title)}
                        disabled={actionLoading !== null}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProposalEditor
        open={showEditor}
        onOpenChange={handleCloseEditor}
        editingProposal={editingProposal}
      />

      <LinkProposalDialog
        open={showLinkDialog}
        onOpenChange={handleCloseLinkDialog}
        proposal={linkingProposal}
      />
    </div>
  );
}
