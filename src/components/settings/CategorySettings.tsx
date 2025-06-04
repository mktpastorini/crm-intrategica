
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCrm } from '@/contexts/CrmContext';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { statusOptions } from '@/types/settings';

export default function CategorySettings() {
  const { toast } = useToast();
  const { pipelineStages, addPipelineStage, updatePipelineStage, deletePipelineStage } = useCrm();
  
  const [leadStatuses, setLeadStatuses] = useState<any[]>(() => {
    const saved = localStorage.getItem('leadStatuses');
    return saved ? JSON.parse(saved) : statusOptions;
  });

  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
  const [editingStage, setEditingStage] = useState<any>(null);

  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6');
  const [editingStatus, setEditingStatus] = useState<any>(null);

  const saveLeadStatuses = (newStatuses: any[]) => {
    setLeadStatuses(newStatuses);
    localStorage.setItem('leadStatuses', JSON.stringify(newStatuses));
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o estágio",
        variant: "destructive",
      });
      return;
    }

    const newStage = {
      id: `stage-${Date.now()}`,
      name: newStageName,
      order: pipelineStages.length + 1,
      color: newStageColor
    };

    addPipelineStage(newStage);
    setNewStageName('');
    setNewStageColor('#3b82f6');
  };

  const handleEditStage = (stage: any) => {
    setEditingStage({ ...stage });
  };

  const handleSaveStageEdit = () => {
    if (!editingStage) return;
    updatePipelineStage(editingStage.id, editingStage);
    setEditingStage(null);
  };

  const handleDeleteStage = (stageId: string) => {
    deletePipelineStage(stageId);
  };

  const handleAddStatus = () => {
    if (!newStatusName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o status",
        variant: "destructive",
      });
      return;
    }

    const newStatus = {
      value: newStatusName,
      label: newStatusName,
      color: newStatusColor
    };

    const newStatuses = [...leadStatuses, newStatus];
    saveLeadStatuses(newStatuses);
    setNewStatusName('');
    setNewStatusColor('#3b82f6');
    toast({
      title: "Status adicionado",
      description: "Novo status foi adicionado com sucesso",
    });
  };

  const handleEditStatus = (status: any) => {
    setEditingStatus({ ...status });
  };

  const handleSaveStatusEdit = () => {
    if (!editingStatus) return;
    const newStatuses = leadStatuses.map(status => 
      status.value === editingStatus.value ? editingStatus : status
    );
    saveLeadStatuses(newStatuses);
    setEditingStatus(null);
    toast({
      title: "Status atualizado",
      description: "Status foi atualizado com sucesso",
    });
  };

  const handleDeleteStatus = (statusValue: string) => {
    const newStatuses = leadStatuses.filter(status => status.value !== statusValue);
    saveLeadStatuses(newStatuses);
    toast({
      title: "Status removido",
      description: "Status foi removido com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Estágios do Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do estágio"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
            />
            <Input
              type="color"
              value={newStageColor}
              onChange={(e) => setNewStageColor(e.target.value)}
              className="w-20"
            />
            <Button onClick={handleAddStage}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {pipelineStages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg">
                {editingStage?.id === stage.id ? (
                  <>
                    <Input
                      value={editingStage.name}
                      onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="color"
                      value={editingStage.color}
                      onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value })}
                      className="w-20"
                    />
                    <Button size="sm" onClick={handleSaveStageEdit}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingStage(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="flex-1 font-medium">{stage.name}</span>
                    <Badge variant="outline">Ordem: {stage.order}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleEditStage(stage)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteStage(stage.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Status dos Leads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do status"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
            />
            <Input
              type="color"
              value={newStatusColor}
              onChange={(e) => setNewStatusColor(e.target.value)}
              className="w-20"
            />
            <Button onClick={handleAddStatus}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {leadStatuses.map((status) => (
              <div key={status.value} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg">
                {editingStatus?.value === status.value ? (
                  <>
                    <Input
                      value={editingStatus.label}
                      onChange={(e) => setEditingStatus({ ...editingStatus, label: e.target.value, value: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="color"
                      value={editingStatus.color}
                      onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                      className="w-20"
                    />
                    <Button size="sm" onClick={handleSaveStatusEdit}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingStatus(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="flex-1 font-medium">{status.label}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEditStatus(status)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteStatus(status.value)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
