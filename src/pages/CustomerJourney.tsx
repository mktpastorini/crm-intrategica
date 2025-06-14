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

interface JourneyMessage {
  id: string;
  title: string;
  content: string;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  stage: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  order: number;
  created_at: string;
}

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
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4">Histórico de Mensagens Enviadas</h3>
          <Button onClick={loadHistory} size="sm" className="mb-2">
            Recarregar
          </Button>
          {historyLoading ? (
            <div className="text-center text-slate-400 py-8">Carregando...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhuma mensagem enviada encontrada.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2 font-semibold">Quando</th>
                    <th className="p-2 font-semibold">Lead</th>
                    <th className="p-2 font-semibold">Estágio</th>
                    <th className="p-2 font-semibold">Mensagem</th>
                    <th className="p-2 font-semibold">Tipo</th>
                    <th className="p-2 font-semibold">Webhook</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b">
                      <td className="p-2">{new Date(h.sent_at).toLocaleString()}</td>
                      <td className="p-2">{h.lead_name || h.lead_id}</td>
                      <td className="p-2">{h.stage}</td>
                      <td className="p-2">{h.message_title}</td>
                      <td className="p-2">{h.message_type}</td>
                      <td className="p-2 text-ellipsis overflow-hidden max-w-[120px]">{h.webhook_url ? "Enviado" : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Kanban da Jornada do Cliente
        <div className="flex gap-4 p-6 min-w-max">
          {pipelineStages.map(stage => (
            <Card key={stage.id} className="w-80 flex-shrink-0">
              <CardHeader>
                <CardTitle>{stage.name}</CardTitle>
              </CardHeader>
              <CardContent
                className="space-y-2 p-2"
                onDragOver={(e) => handleDragOver(e)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {getMessagesByStage(stage.id).map(message => (
                  <div
                    key={message.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, message.id)}
                    className="bg-slate-50 rounded p-2 shadow-sm border flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-sm">{message.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getDelayText(message.delay, message.delayUnit)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{getTypeIcon(message.type)}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(message)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(message.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
