import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Clock, 
  Users, 
  MessageSquare, 
  Image as ImageIcon, 
  Calendar as CalendarIcon,
  Save,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { SystemSettings } from '@/types/settings';

interface ScheduledMessage {
  id: string;
  message: string;
  leads: any[];
  scheduledFor: string;
  createdBy: string;
  mediaFile?: string;
}

export default function Messages() {
  const { leads } = useCrm();
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar configurações do sistema
  const settings: SystemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  // Templates com persistência via localStorage
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('messageTemplates');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Primeiro Contato', content: 'Olá {nome}, tudo bem? Sou da {empresa} e gostaria de conversar sobre nossos serviços.' },
      { id: '2', name: 'Follow-up', content: 'Oi {nome}, espero que esteja bem! Queria saber se já teve tempo de analisar nossa proposta.' },
      { id: '3', name: 'Agradecimento', content: 'Obrigado pelo seu tempo hoje, {nome}! Foi um prazer conhecer a {empresa}.' }
    ];
  });
  const [templateName, setTemplateName] = useState('');

  // Mensagens agendadas com persistência via localStorage
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>(() => {
    const saved = localStorage.getItem('scheduledMessages');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar templates no localStorage sempre que mudarem
  const saveTemplates = (newTemplates: any[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('messageTemplates', JSON.stringify(newTemplates));
  };

  // Salvar mensagens agendadas no localStorage sempre que mudarem
  const saveScheduledMessages = (newScheduled: ScheduledMessage[]) => {
    setScheduledMessages(newScheduled);
    localStorage.setItem('scheduledMessages', JSON.stringify(newScheduled));
  };

  const filteredLeads = leads.filter(lead => {
    const statusMatch = filterStatus === 'all' || lead.status === filterStatus;
    const stageMatch = filterStage === 'all' || lead.pipelineStage === filterStage;
    return statusMatch && stageMatch;
  });

  const selectedLeadsData = leads.filter(lead => selectedLeads.includes(lead.id));

  const handleLeadSelect = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSendNow = async () => {
    if (!message.trim() || selectedLeads.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione pelo menos um lead e escreva uma mensagem",
        variant: "destructive",
      });
      return;
    }

    const payload = selectedLeadsData.map(lead => ({
      nome: lead.name,
      telefone: lead.phone,
      empresa: lead.company,
      mensagem: message.replace('{nome}', lead.name).replace('{empresa}', lead.company)
    }));

    // Enviar para webhook se habilitado e URL configurada
    if (settings.enableMessageWebhook && settings.messageWebhookUrl) {
      try {
        const response = await fetch(settings.messageWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: payload,
            timestamp: new Date().toISOString(),
            user: user?.name || 'Sistema'
          })
        });

        if (!response.ok) {
          throw new Error('Erro no webhook');
        }

        console.log('Webhook enviado com sucesso:', payload);
        toast({
          title: "Mensagens enviadas",
          description: `${selectedLeads.length} mensagem(ns) enviada(s) via webhook`,
        });
      } catch (error) {
        console.error('Erro ao enviar webhook:', error);
        toast({
          title: "Erro no webhook",
          description: "Erro ao enviar para o webhook. Mensagens salvas localmente.",
          variant: "destructive",
        });
      }
    } else {
      console.log('Webhook desabilitado ou URL não configurada:', payload);
      toast({
        title: "Mensagens processadas",
        description: `${selectedLeads.length} mensagem(ns) processada(s) (webhook não configurado)`,
      });
    }

    setMessage('');
    setSelectedLeads([]);
    setMediaFile(null);
  };

  const handleSchedule = () => {
    if (!message.trim() || selectedLeads.length === 0 || !scheduledDate || !scheduledTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para agendar",
        variant: "destructive",
      });
      return;
    }

    const newScheduled: ScheduledMessage = {
      id: Date.now().toString(),
      message,
      leads: selectedLeadsData,
      scheduledFor: `${scheduledDate} ${scheduledTime}`,
      createdBy: user?.name || 'Usuário',
      mediaFile: mediaFile?.name || undefined
    };

    const updatedScheduled = [...scheduledMessages, newScheduled];
    saveScheduledMessages(updatedScheduled);

    toast({
      title: "Mensagem agendada",
      description: `Mensagem agendada para ${new Date(scheduledDate + ' ' + scheduledTime).toLocaleString('pt-BR')}`,
    });

    setMessage('');
    setSelectedLeads([]);
    setScheduledDate('');
    setScheduledTime('');
    setShowSchedule(false);
    setMediaFile(null);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome do template e a mensagem",
        variant: "destructive",
      });
      return;
    }

    const newTemplate = {
      id: Date.now().toString(),
      name: templateName,
      content: message
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    setTemplateName('');

    toast({
      title: "Template salvo",
      description: `Template "${templateName}" foi salvo com sucesso`,
    });
  };

  const handleLoadTemplate = (template: any) => {
    setMessage(template.content);
    toast({
      title: "Template carregado",
      description: `Template "${template.name}" foi carregado`,
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    
    toast({
      title: "Template excluído",
      description: `Template "${template?.name}" foi excluído`,
    });
  };

  const handleDeleteScheduled = (scheduledId: string) => {
    const updatedScheduled = scheduledMessages.filter(s => s.id !== scheduledId);
    saveScheduledMessages(updatedScheduled);
    
    toast({
      title: "Agendamento cancelado",
      description: "Mensagem agendada foi cancelada",
    });
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB",
          variant: "destructive",
        });
        return;
      }
      setMediaFile(file);
      toast({
        title: "Arquivo selecionado",
        description: `${file.name} foi selecionado`,
      });
    }
  };

  const removeMediaFile = () => {
    setMediaFile(null);
    toast({
      title: "Arquivo removido",
      description: "Arquivo de mídia foi removido",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Envio de Mensagens</h2>
        <p className="text-slate-600">Envie mensagens personalizadas para seus leads</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Selecionados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{selectedLeads.length}</div>
            <p className="text-sm text-blue-600">leads selecionados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{templates.length}</div>
            <p className="text-sm text-green-600">templates salvos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{scheduledMessages.length}</div>
            <p className="text-sm text-purple-600">mensagens agendadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{filteredLeads.length}</div>
            <p className="text-sm text-orange-600">leads disponíveis</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Destinatários</CardTitle>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStage} onValueChange={setFilterStage}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estágios</SelectItem>
                  <SelectItem value="aguardando-inicio">Aguardando Início</SelectItem>
                  <SelectItem value="primeiro-contato">Primeiro Contato</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Selecionar todos ({filteredLeads.length})
                </Label>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg">
                    <Checkbox
                      id={lead.id}
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={(checked) => handleLeadSelect(lead.id, checked as boolean)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 truncate">{lead.name}</p>
                        <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{lead.company}</p>
                      <p className="text-xs text-slate-500">{lead.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Composer */}
        <Card>
          <CardHeader>
            <CardTitle>Compor Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Templates */}
            <div>
              <Label>Templates Salvos</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center gap-2 p-2 border border-slate-200 rounded">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLoadTemplate(template)}
                      className="flex-1 justify-start"
                    >
                      {template.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui... Use {nome} e {empresa} para personalizar"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">
                Use {'{nome}'} e {'{empresa}'} para personalizar a mensagem
              </p>
            </div>

            {/* Media Upload */}
            <div>
              <Label>Adicionar Imagem/Vídeo (opcional)</Label>
              <div className="mt-2">
                {mediaFile ? (
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-700 flex-1">{mediaFile.name}</span>
                    <Button variant="ghost" size="sm" onClick={removeMediaFile}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                      id="media-upload"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => document.getElementById('media-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Selecionar Imagem/Vídeo
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Save Template */}
            <div className="flex gap-2">
              <Input
                placeholder="Nome do template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <Button variant="outline" onClick={handleSaveTemplate}>
                <Save className="w-4 h-4" />
              </Button>
            </div>

            {/* Schedule Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule"
                checked={showSchedule}
                onCheckedChange={(checked) => setShowSchedule(checked as boolean)}
              />
              <Label htmlFor="schedule">Agendar envio</Label>
            </div>

            {/* Schedule Fields */}
            {showSchedule && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {showSchedule ? (
                <Button onClick={handleSchedule} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Agendar Envio
                </Button>
              ) : (
                <Button onClick={handleSendNow} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Agora
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Messages */}
      {scheduledMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mensagens Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledMessages.map((scheduled) => (
                <div key={scheduled.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarIcon className="w-4 h-4 text-slate-600" />
                        <span className="font-medium">{new Date(scheduled.scheduledFor).toLocaleString('pt-BR')}</span>
                        <Badge variant="outline">{scheduled.leads.length} destinatários</Badge>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{scheduled.message}</p>
                      <p className="text-xs text-slate-500">Criado por: {scheduled.createdBy}</p>
                      {scheduled.mediaFile && (
                        <p className="text-xs text-slate-500">Arquivo: {scheduled.mediaFile}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteScheduled(scheduled.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
