import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCrm } from '@/contexts/CrmContext';
import { Plus, Edit, Trash2, Clock, Calendar, Image, Video, MessageSquare } from 'lucide-react';
import { fetchJourneyHistory, JourneyMessageHistory } from "@/utils/journeyHistoryService";
import { useMemo } from "react";
import JourneyKanban from "../components/journey/JourneyKanban";
import JourneyHistoryTable from "../components/journey/JourneyHistoryTable";
import type { JourneyMessage } from "../components/journey/types";

export default function CustomerJourney() {
  const { toast } = useToast();
  const { pipelineStages } = useCrm();
  const [messages, setMessages] = useState<JourneyMessage[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState<JourneyMessage | null>(null);
  
  // SUBSECTION/Tab control - keep only one declaration here
  const [selectedStage, setSelectedStage] = useState<string>("");

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    delay: 1,
    delayUnit: 'days' as 'minutes' | 'hours' | 'days',
    stage: '',
    type: 'text' as 'text' | 'image' | 'video',
    mediaUrl: ''
  });

  // Novo: Histórico
  const [history, setHistory] = useState<JourneyMessageHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    const saved = localStorage.getItem('journeyMessages');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  };

  const saveMessages = (newMessages: JourneyMessage[]) => {
    setMessages(newMessages);
    localStorage.setItem('journeyMessages', JSON.stringify(newMessages));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.stage) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const newMessage: JourneyMessage = {
      id: editingMessage?.id || `msg-${Date.now()}`,
      title: formData.title,
      content: formData.content,
      delay: formData.delay,
      delayUnit: formData.delayUnit,
      stage: formData.stage,
      type: formData.type,
      mediaUrl: formData.mediaUrl,
      order: editingMessage?.order || messages.filter(m => m.stage === formData.stage).length + 1,
      created_at: editingMessage?.created_at || new Date().toISOString()
    };

    let newMessages;
    if (editingMessage) {
      newMessages = messages.map(m => m.id === editingMessage.id ? newMessage : m);
    } else {
      newMessages = [...messages, newMessage];
    }

    saveMessages(newMessages);
    setFormData({
      title: '',
      content: '',
      delay: 1,
      delayUnit: 'days',
      stage: '',
      type: 'text',
      mediaUrl: ''
    });
    setEditingMessage(null);
    setShowAddDialog(false);

    toast({
      title: editingMessage ? "Mensagem atualizada" : "Mensagem criada",
      description: "Mensagem da jornada foi salva com sucesso",
    });
  };

  const handleEdit = (message: JourneyMessage) => {
    setEditingMessage(message);
    setFormData({
      title: message.title,
      content: message.content,
      delay: message.delay,
      delayUnit: message.delayUnit,
      stage: message.stage,
      type: message.type,
      mediaUrl: message.mediaUrl || ''
    });
    setShowAddDialog(true);
  };

  const handleDelete = (messageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;
    
    const newMessages = messages.filter(m => m.id !== messageId);
    saveMessages(newMessages);
    
    toast({
      title: "Mensagem excluída",
      description: "Mensagem foi removida da jornada",
    });
  };

  const handleDragStart = (e: React.DragEvent, messageId: string) => {
    e.dataTransfer.setData('messageId', messageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const messageId = e.dataTransfer.getData('messageId');
    const message = messages.find(m => m.id === messageId);
    
    if (message && message.stage !== targetStage) {
      const updatedMessage = { ...message, stage: targetStage };
      const newMessages = messages.map(m => m.id === messageId ? updatedMessage : m);
      saveMessages(newMessages);
      
      toast({
        title: "Mensagem movida",
        description: `Mensagem foi movida para ${pipelineStages.find(s => s.id === targetStage)?.name}`,
      });
    }
  };

  const getMessagesByStage = (stageId: string) => {
    return messages.filter(m => m.stage === stageId).sort((a, b) => a.order - b.order);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getDelayText = (delay: number, unit: 'minutes' | 'hours' | 'days') => {
    const unitMap = {
      'minutes': 'minuto(s)',
      'hours': 'hora(s)',
      'days': 'dia(s)'
    };
    return `${delay} ${unitMap[unit]} após entrada`;
  };

  // Load history on open tab
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const list = await fetchJourneyHistory(50);
      setHistory(list);
    } catch (e) {
      console.log("Erro ao carregar histórico:", e);
    }
    setHistoryLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header fixo */}
      <div className="flex-shrink-0 p-6 bg-white border-b shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Jornada do Cliente</h2>
            <p className="text-slate-600">Configure mensagens automáticas para cada estágio do pipeline</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingMessage ? 'Editar Mensagem' : 'Nova Mensagem'}</DialogTitle>
                <DialogDescription>
                  Configure uma mensagem automática para ser enviada quando o lead entrar em um estágio
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="stage">Estágio</Label>
                  <Select value={formData.stage} onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estágio" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelineStages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Título da Mensagem</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Mensagem de boas-vindas"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo de Mensagem</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="video">Vídeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="content">Conteúdo</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Digite o conteúdo da mensagem..."
                    rows={4}
                    required
                  />
                </div>
                {(formData.type === 'image' || formData.type === 'video') && (
                  <div>
                    <Label htmlFor="mediaUrl">URL da Mídia</Label>
                    <Input
                      id="mediaUrl"
                      value={formData.mediaUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, mediaUrl: e.target.value }))}
                      placeholder="https://exemplo.com/arquivo.jpg"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delay">Atraso</Label>
                    <Input
                      id="delay"
                      type="number"
                      value={formData.delay}
                      onChange={(e) => setFormData(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="delayUnit">Unidade</Label>
                    <Select value={formData.delayUnit} onValueChange={(value: any) => setFormData(prev => ({ ...prev, delayUnit: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutes">Minutos</SelectItem>
                        <SelectItem value="hours">Horas</SelectItem>
                        <SelectItem value="days">Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingMessage ? 'Atualizar' : 'Criar Mensagem'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddDialog(false);
                    setEditingMessage(null);
                    setFormData({
                      title: '',
                      content: '',
                      delay: 1,
                      delayUnit: 'days',
                      stage: '',
                      type: 'text',
                      mediaUrl: ''
                    });
                  }} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sub-tabs da sessão Jornada */}
      <div className="flex space-x-2 px-6 pt-2 border-b bg-slate-50">
        <button
          className={`py-2 px-4 rounded-t font-semibold ${
            selectedStage !== "historico" ? "bg-white border-b-2 border-blue-600 text-blue-700" : "bg-slate-100"
          }`}
          onClick={() => setSelectedStage("")}
        >
          Kanban
        </button>
        <button
          className={`py-2 px-4 rounded-t font-semibold ${
            selectedStage === "historico" ? "bg-white border-b-2 border-blue-600 text-blue-700" : "bg-slate-100"
          }`}
          onClick={() => {
            setSelectedStage("historico");
            loadHistory();
          }}
        >
          Histórico
        </button>
      </div>

      {/* Conteúdo das abas */}
      {selectedStage === "historico" ? (
        <JourneyHistoryTable
          history={history}
          historyLoading={historyLoading}
          onReload={loadHistory}
        />
      ) : (
        <JourneyKanban
          pipelineStages={pipelineStages}
          messages={messages}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}
    </div>
  );
}
