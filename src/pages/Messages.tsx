
import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Phone, 
  Mail, 
  Save,
  Users,
  X
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  content: string;
}

export default function Messages() {
  const { leads, users } = useCrm();
  const { settings } = useSystemSettingsDB();
  const { toast } = useToast();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [messageType, setMessageType] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('none');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendMode, setSendMode] = useState<'individual' | 'bulk'>('individual');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const messageTypeIcons = {
    whatsapp: MessageSquare,
    email: Mail,
    sms: Phone
  };

  const categories = Array.from(new Set(leads.map(lead => lead.niche))).filter(Boolean);

  useEffect(() => {
    const savedTemplates = localStorage.getItem('messageTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }

    const savedHistory = localStorage.getItem('messageHistory');
    if (savedHistory) {
      setMessageHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveTemplate = () => {
    if (!templateName.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do template e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      name: templateName,
      type: messageType,
      subject: messageType === 'email' ? subject : undefined,
      content: message
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('messageTemplates', JSON.stringify(updatedTemplates));

    setShowTemplateDialog(false);
    setTemplateName('');

    toast({
      title: "Template salvo",
      description: "Template de mensagem foi salvo com sucesso",
    });
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.content);
      if (template.subject) {
        setSubject(template.subject);
      }
    }
  };

  const getLeadsToSend = () => {
    if (sendMode === 'individual') {
      return leads.filter(lead => selectedLeads.includes(lead.id));
    } else {
      // Bulk mode - by categories
      return leads.filter(lead => selectedCategories.includes(lead.niche));
    }
  };

  const handleSendMessage = async () => {
    const leadsToSend = getLeadsToSend();
    
    if (leadsToSend.length === 0 || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: sendMode === 'individual' ? "Selecione leads e digite uma mensagem" : "Selecione categorias e digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    if (messageType === 'email' && !subject.trim()) {
      toast({
        title: "Assunto obrigatório",
        description: "O assunto é obrigatório para e-mails",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      for (const lead of leadsToSend) {
        const messageData = {
          leadId: lead.id,
          leadName: lead.name,
          leadPhone: lead.phone,
          leadEmail: lead.email,
          company: lead.company,
          type: messageType,
          subject: messageType === 'email' ? subject : undefined,
          message: message,
          timestamp: new Date().toISOString()
        };

        // Send to webhook if configured
        if (settings.messageWebhookUrl) {
          try {
            await fetch(settings.messageWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(messageData)
            });
          } catch (error) {
            console.error('Erro ao enviar para webhook:', error);
          }
        }

        // Save to history
        const historyEntry = {
          id: Date.now().toString() + Math.random(),
          ...messageData,
          status: 'sent'
        };

        const updatedHistory = [historyEntry, ...messageHistory];
        setMessageHistory(updatedHistory);
        localStorage.setItem('messageHistory', JSON.stringify(updatedHistory));
      }

      // Reset form
      setMessage('');
      setSubject('');
      setSelectedLeads([]);
      setSelectedCategories([]);
      setSelectedTemplate('none');

      toast({
        title: "Mensagens enviadas",
        description: `${leadsToSend.length} mensagens foram enviadas com sucesso`,
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLeadToggle = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const availableLeads = leads.filter(lead => 
    messageType === 'email' ? lead.email : lead.phone
  );

  const Icon = messageTypeIcons[messageType];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Central de Mensagens</h2>
          <p className="text-slate-600">Envie mensagens para seus leads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="w-5 h-5" />
                Nova Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Modo de Envio</Label>
                  <Select value={sendMode} onValueChange={(value: 'individual' | 'bulk') => setSendMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual (Selecionar Leads)</SelectItem>
                      <SelectItem value="bulk">Em Massa (Por Categoria)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de Mensagem</Label>
                  <Select value={messageType} onValueChange={(value: 'whatsapp' | 'email' | 'sms') => setMessageType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          E-mail
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          SMS
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sendMode === 'individual' ? (
                <div>
                  <Label>Selecionar Leads</Label>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {availableLeads.map(lead => (
                      <div key={lead.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lead-${lead.id}`}
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => handleLeadToggle(lead.id)}
                        />
                        <Label htmlFor={`lead-${lead.id}`} className="flex-1 cursor-pointer">
                          {lead.name} - {lead.company}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedLeads.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600">
                        {selectedLeads.length} lead(s) selecionado(s)
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <Label>Selecionar Categorias</Label>
                  <div className="mt-2 space-y-2">
                    {categories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <Label htmlFor={`category-${category}`} className="flex-1 cursor-pointer">
                          {category}
                        </Label>
                        <Badge variant="secondary">
                          {leads.filter(l => l.niche === category).length} leads
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {selectedCategories.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600">
                        {leads.filter(l => selectedCategories.includes(l.niche)).length} leads serão incluídos
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Select value={selectedTemplate} onValueChange={(value) => {
                  setSelectedTemplate(value);
                  if (value !== 'none') handleLoadTemplate(value);
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione um template</SelectItem>
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
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Salvar Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Salvar Template</DialogTitle>
                      <DialogDescription>
                        Salve esta mensagem como um template para usar novamente
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
                        <Button onClick={saveTemplate} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                        <Button variant="outline" onClick={() => setShowTemplateDialog(false)} className="flex-1">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {messageType === 'email' && (
                <div>
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Digite o assunto do e-mail"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={6}
                />
              </div>

              <Button 
                onClick={handleSendMessage}
                disabled={getLeadsToSend().length === 0 || !message.trim() || isSending}
                className="w-full"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {isSending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar {sendMode === 'bulk' ? 'em Massa' : 'Mensagem'}
                    {getLeadsToSend().length > 0 && ` (${getLeadsToSend().length})`}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messageHistory.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    Nenhuma mensagem enviada ainda
                  </p>
                ) : (
                  messageHistory.map((msg) => (
                    <div key={msg.id} className="border-l-4 border-blue-200 pl-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{msg.leadName}</span>
                        <Badge variant="outline" className="text-xs">
                          {msg.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {msg.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(msg.timestamp).toLocaleString()}
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
