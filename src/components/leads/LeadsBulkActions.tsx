
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface User {
  id: string;
  name: string;
}

interface LeadsBulkActionsProps {
  selectedLeads: string[];
  onClearSelection: () => void;
  users: User[];
}

export default function LeadsBulkActions({ selectedLeads, onClearSelection, users }: LeadsBulkActionsProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { updateLead, deleteLead } = useCrm();
  const { profile } = useAuth();

  const handleBulkAssign = async () => {
    if (!selectedUserId) {
      toast({
        title: "Erro",
        description: "Selecione um usuário responsável",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const leadId of selectedLeads) {
        try {
          await updateLead(leadId, { responsible_id: selectedUserId });
          successCount++;
        } catch (error) {
          console.error(`Erro ao atribuir lead ${leadId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Leads atribuídos",
          description: `${successCount} lead(s) atribuído(s) com sucesso${errorCount > 0 ? ` (${errorCount} falharam)` : ''}`,
        });
        onClearSelection();
        setSelectedUserId('');
      } else {
        toast({
          title: "Erro",
          description: "Nenhum lead foi atribuído",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro na atribuição em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao atribuir leads",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedLeads.length} lead(s) selecionado(s)?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const leadId of selectedLeads) {
        try {
          await deleteLead(leadId);
          successCount++;
        } catch (error) {
          console.error(`Erro ao excluir lead ${leadId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Leads excluídos",
          description: `${successCount} lead(s) excluído(s) com sucesso${errorCount > 0 ? ` (${errorCount} falharam)` : ''}`,
        });
        onClearSelection();
      } else {
        toast({
          title: "Erro",
          description: "Nenhum lead foi excluído",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro na exclusão em lote:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir leads",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedLeads.length === 0) return null;

  const canDelete = profile?.role === 'admin' || profile?.role === 'supervisor';

  return (
    <Card className="mb-4 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800">
              {selectedLeads.length} lead(s) selecionado(s)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="text-blue-700 border-blue-300"
            >
              Limpar seleção
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkAssign}
                disabled={isAssigning || !selectedUserId}
                size="sm"
              >
                {isAssigning ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Atribuir
                  </>
                )}
              </Button>
            </div>
            
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                size="sm"
              >
                {isDeleting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
