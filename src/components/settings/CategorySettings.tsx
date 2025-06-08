
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCrm } from '@/contexts/CrmContext';
import { supabase } from '@/integrations/supabase/client';
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
  
  const [leadStatuses, setLeadStatuses] = useState<any[]>(statusOptions);
  const [loading, setLoading] = useState(false);

  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
  const [editingStage, setEditingStage] = useState<any>(null);

  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6');
  const [editingStatus, setEditingStatus] = useState<any>(null);

  // Carregar status dos leads do banco
  useEffect(() => {
    loadLeadStatuses();
  }, []);

  const loadLeadStatuses = async () => {
    try {
      setLoading(true);
      console.log('Carregando status dos leads...');
      
      // Primeiro tenta carregar do localStorage como fallback
      const localStatuses = localStorage.getItem('leadStatuses');
      if (localStatuses) {
        setLeadStatuses(JSON.parse(localStatuses));
      } else {
        setLeadStatuses(statusOptions);
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
      
      // Salvar no localStorage como backup
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

  const savePipelineStages = async () => {
    try {
      console.log('Salvando estágios do pipeline:', pipelineStages);
      
      // Salvar no localStorage como backup
      localStorage.setItem('pipelineStages', JSON.stringify(pipelineStages));
      
      toast({
        title: "Estágios salvos",
        description: "Estágios do pipeline foram salvos com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar estágios:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar estágios do pipeline",
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
      id: `stage-${Date.now()}`,
      name: newStageName,
      order: pipelineStages.length + 1,
      color: newStageColor
    };

    addPipelineStage(newStage);
    await savePipelineStages();
    setNewStageName('');
    setNewStageColor('#3b82f6');
  };

  const handleEditStage = (stage: any) => {
    setEditingStage({ ...stage });
  };

  const handleSaveStageEdit = async () => {
    if (!editingStage) return;
    updatePipelineStage(editingStage.id, editingStage);
    await savePipelineStages();
    setEditingStage(null);
  };

  const handleDeleteStage = async (stageId: string) => {
    deletePipelineStage(stageId);
    await savePipelineStages();
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
      color: newStatusColor
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
          
          <Button onClick={savePipelineStages} className="w-full" variant="outline">
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
          
          <Button onClick={() => saveLeadStatuses(leadStatuses)} className="w-full" variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Salvar Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
