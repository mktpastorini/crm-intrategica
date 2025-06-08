
import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, Phone, Mail, MessageCircle, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  content: string;
}

export default function Messages() {
  const { leads, users } = useCrm();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [messageType, setMessageType] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessageHistory();
    loadTemplates();
  }, []);

  const loadMessageHistory = () => {
    const saved = localStorage.getItem('messageHistory');
    if (saved) {
      setMessageHistory(JSON.parse(saved));
    }
  };

  const saveMessageHistory = (newHistory: any[]) => {
    setMessageHistory(newHistory);
    localStorage.setItem('messageHistory', JSON.stringify(newHistory));
  };

  const loadTemplates = () => {
    const saved = localStorage.getItem('messageTemplates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    }
  };

  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('messageTemplates', JSON.stringify(newTemplates));
  };

  const handleSendMessage = async () => {
    if (!selectedLead || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um lead e digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const lead = leads.find(l => l.id === selectedLead);
      if (!lead) return;

      // Get webhook URL from settings
      const settings = localStorage.getItem('systemSettings');
      if (!settings) {
        toast({
          title: "Configuração necessária",
          description: "Configure o webhook de mensagens nas configurações",
          variant: "destructive",
        });
        return;
      }

      const { messageWebhookUrl, enableMessageWebhook } = JSON.parse(settings);
      if (!messageWebhookUrl || !enableMessageWebhook) {
        toast({
          title: "Webhook não configurado",
          description: "Configure o webhook de mensagens nas configurações",
          variant: "destructive",
        });
        return;
      }

      // Send webhook
      const webhookData = {
        lead_name: lead.name,
        lead_email: lead.email,
        lead_phone: lead.phone,
        company: lead.company,
        message_type: messageType,
        subject: messageType === 'email' ? subject : '',
        message: message,
        timestamp: new Date().toISOString()
      };

      await fetch(messageWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(webhookData),
      });

      // Save to history
      const newMessage = {
        id: `msg-${Date.now()}`,
        leadId: selectedLead,
        leadName: lead.name,
        type: messageType,
        subject: messageType === 'email' ? subject : '',
        content: message,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      const updatedHistory = [newMessage, ...messageHistory];
      saveMessageHistory(updatedHistory);

      // Reset form
      setMessage('');
      setSubject('');
      setSelectedLead('');
      setSelectedTemplate('');

      toast({
        title: "Mensagem enviada",
        description: "Mensagem foi enviada com sucesso via webhook",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar",
        description: "Erro ao enviar mensagem via webhook",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
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

    const newTemplate: MessageTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      type: messageType,
      subject: messageType === 'email' ? subject : '',
      content: message
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);

    setTemplateName('');
    setShowTemplateDialog(false);

    toast({
      title: "Template salvo",
      description: "Template foi salvo com sucesso",
    });
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageType(template.type);
      setSubject(template.subject || '');
      setMessage(template.content);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    
    toast({
      title: "Template excluído",
      description: "Template foi excluído com sucesso",
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'email': return <Mail className="w-4 h-4 text-blue-600" />;
      case 'sms': return <Phone className="w-4 h-4 text-orange-600" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getMessageBadgeColor = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Usuário não encontrado';
  };

  // Filtrar leads com pipeline_stage válido
  const availableLeads = leads.filter(lead => lead.pipeline_stage && lead.pipeline_stage !== 'contrato-assinado');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mensagens</h2>
        <p className="text-slate-600">Envie mensagens personalizadas para seus leads via webhook</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Enviar Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lead</label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lead" />
                </SelectTrigger>
                <SelectContent>
                  {availableLeads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Mensagem</label>
              <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Template</label>
              <div className="flex gap-2">
                <Select value={selectedTemplate} onValueChange={(value) => {
                  setSelectedTemplate(value);
                  if (value) handleLoadTemplate(value);
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates
                      .filter(t => t.type === messageType)
                      .map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Salvar Template</DialogTitle>
                      <DialogDescription>
                        Salve a mensagem atual como template para reutilizar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="template-name">Nome do Template</Label>
                        <Input
                          id="template-name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="Digite o nome do template"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveTemplate} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Template
                        </Button>
                        <Button variant="outline" onClick={() => setShowTemplateDialog(false)} className="flex-1">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {messageType === 'email' && (
              <div>
                <label className="block text-sm font-medium mb-2">Assunto</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Digite o assunto do e-mail"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Mensagem</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={6}
              />
            </div>

            <Button 
              onClick={handleSendMessage}
              disabled={!selectedLead || !message.trim() || isSending}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar Mensagem'}
            </Button>
          </CardContent>
        </Card>

        {/* Templates & History */}
        <div className="space-y-6">
          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Templates Salvos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {templates.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p>Nenhum template salvo</p>
                  </div>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMessageIcon(template.type)}
                          <span className="font-medium text-sm">{template.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getMessageBadgeColor(template.type)}>
                            {template.type.toUpperCase()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {template.subject && (
                        <p className="text-xs font-medium text-slate-700 mb-1">
                          Assunto: {template.subject}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {template.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messageHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p>Nenhuma mensagem enviada ainda</p>
                  </div>
                ) : (
                  messageHistory.map((msg) => (
                    <div key={msg.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMessageIcon(msg.type)}
                          <span className="font-medium">{msg.leadName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getMessageBadgeColor(msg.type)}>
                            {msg.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(msg.timestamp).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      {msg.subject && (
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          Assunto: {msg.subject}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 line-clamp-3">
                        {msg.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
