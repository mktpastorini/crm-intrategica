
import { useState, useEffect } from 'react';
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
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { statusOptions } from '@/types/settings';

export default function CategorySettings() {
  const { toast } = useToast();
  const { 
    pipelineStages, 
    addPipelineStage, 
    updatePipelineStage, 
    deletePipelineStage,
    savePipelineStages 
  } = useCrm();
  
  const [leadStatuses, setLeadStatuses] = useState<any[]>(statusOptions);
  const [loading, setLoading] = useState(false);

  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
  const [editingStage, setEditingStage] = useState<any>(null);

  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6');
  const [editingStatus, setEditingStatus] = useState<any>(null);

  // Carregar status dos leads do localStorage
  useEffect(() => {
    loadLeadStatuses();
  }, []);

  const loadLeadStatuses = async () => {
    try {
      setLoading(true);
      console.log('Carregando status dos leads...');
      
      // Carregar do localStorage
      const localStatuses = localStorage.getItem('leadStatuses');
      if (localStatuses) {
        setLeadStatuses(JSON.parse(localStatuses));
      } else {
        setLeadStatuses(statusOptions);
        localStorage.setItem('leadStatuses', JSON.stringify(statusOptions));
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      setLeadStatuses(statusOptions);
    } finally {
      setLoading(false);
    }
  };

  const saveLeadStatuses = async (newStatuses: any[]) => {
    try {
      console.log('Salvando status dos leads:', newStatuses);
      
      // Salvar no localStorage
      localStorage.setItem('leadStatuses', JSON.stringify(newStatuses));
      setLeadStatuses(newStatuses);
      
      toast({
        title: "Status salvos",
        description: "Status dos leads foram salvos com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar status dos leads",
        variant: "destructive",
      });
    }
  };

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o estágio",
        variant: "destructive",
      });
      return;
    }

    const newStage = {
      name: newStageName,
      order: pipelineStages.length + 1,
      color: newStageColor
    };

    await addPipelineStage(newStage);
    setNewStageName('');
    setNewStageColor('#3b82f6');
  };

  const handleEditStage = (stage: any) => {
    setEditingStage({ ...stage });
  };

  const handleSaveStageEdit = async () => {
    if (!editingStage) return;
    await updatePipelineStage(editingStage.id, editingStage);
    setEditingStage(null);
  };

  const handleDeleteStage = async (stageId: string) => {
    await deletePipelineStage(stageId);
  };

  const moveStageUp = async (index: number) => {
    if (index === 0) return;
    
    const newStages = [...pipelineStages];
    [newStages[index], newStages[index - 1]] = [newStages[index - 1], newStages[index]];
    
    // Update order values
    newStages.forEach((stage, idx) => {
      stage.order = idx + 1;
    });
    
    await savePipelineStages(newStages);
  };

  const moveStageDown = async (index: number) => {
    if (index === pipelineStages.length - 1) return;
    
    const newStages = [...pipelineStages];
    [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];
    
    // Update order values
    newStages.forEach((stage, idx) => {
      stage.order = idx + 1;
    });
    
    await savePipelineStages(newStages);
  };

  const handleAddStatus = async () => {
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
      color: newStatusColor,
      order: leadStatuses.length + 1
    };

    const newStatuses = [...leadStatuses, newStatus];
    await saveLeadStatuses(newStatuses);
    setNewStatusName('');
    setNewStatusColor('#3b82f6');
  };

  const handleEditStatus = (status: any) => {
    setEditingStatus({ ...status });
  };

  const handleSaveStatusEdit = async () => {
    if (!editingStatus) return;
    const newStatuses = leadStatuses.map(status => 
      status.value === editingStatus.value ? editingStatus : status
    );
    await saveLeadStatuses(newStatuses);
    setEditingStatus(null);
  };

  const handleDeleteStatus = async (statusValue: string) => {
    const newStatuses = leadStatuses.filter(status => status.value !== statusValue);
    await saveLeadStatuses(newStatuses);
  };

  const moveStatusUp = async (index: number) => {
    if (index === 0) return;
    
    const newStatuses = [...leadStatuses];
    [newStatuses[index], newStatuses[index - 1]] = [newStatuses[index - 1], newStatuses[index]];
    
    // Update order values
    newStatuses.forEach((status, idx) => {
      status.order = idx + 1;
    });
    
    await saveLeadStatuses(newStatuses);
  };

  const moveStatusDown = async (index: number) => {
    if (index === leadStatuses.length - 1) return;
    
    const newStatuses = [...leadStatuses];
    [newStatuses[index], newStatuses[index + 1]] = [newStatuses[index + 1], newStatuses[index]];
    
    // Update order values
    newStatuses.forEach((status, idx) => {
      status.order = idx + 1;
    });
    
    await saveLeadStatuses(newStatuses);
  };

  const handleSavePipelineStages = async () => {
    await savePipelineStages(pipelineStages);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Sort stages and statuses by order
  const sortedStages = [...pipelineStages].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedStatuses = [...leadStatuses].sort((a, b) => (a.order || 0) - (b.order || 0));

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
            {sortedStages.map((stage, index) => (
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
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveStageUp(index)}
                        disabled={index === 0}
                        className="h-4 w-4 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveStageDown(index)}
                        disabled={index === sortedStages.length - 1}
                        className="h-4 w-4 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
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
          
          <Button onClick={handleSavePipelineStages} className="w-full" variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Salvar Estágios
          </Button>
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
            {sortedStatuses.map((status, index) => (
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
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveStatusUp(index)}
                        disabled={index === 0}
                        className="h-4 w-4 p-0"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveStatusDown(index)}
                        disabled={index === sortedStatuses.length - 1}
                        className="h-4 w-4 p-0"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="flex-1 font-medium">{status.label}</span>
                    <Badge variant="outline">Ordem: {status.order || index + 1}</Badge>
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
          
          <Button onClick={() => saveLeadStatuses(sortedStatuses)} className="w-full" variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Salvar Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
