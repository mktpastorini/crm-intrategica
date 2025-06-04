
import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, Clock, Save, Image, Search, Users, MessageSquare } from 'lucide-react';

interface ScheduledMessage {
  id: string;
  recipients: string[];
  message: string;
  scheduledFor: string;
  createdAt: string;
}

export default function Messages() {
  const { leads } = useCrm();
  const { toast } = useToast();
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [templates] = useState([
    'Olá {nome}! Temos uma proposta especial para a {empresa}. Gostaria de agendar uma conversa?',
    'Oi {nome}! Vamos conversar sobre as necessidades de marketing da {empresa}?',
    'Prezado {nome}, preparamos uma análise personalizada para a {empresa}. Posso apresentar?'
  ]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const statuses = ['Pendente', 'Follow-up', 'Proposta Enviada', 'Perdido', 'Ganho'];
  const stages = ['aguardando-inicio', 'primeiro-contato', 'reuniao', 'proposta-enviada', 'negociacao', 'contrato-assinado'];

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
    const matchesStage = filterStage === 'all' || lead.pipelineStage === filterStage;
    
    return matchesSearch && matchesStatus && matchesStage;
  });

  const handleLeadToggle = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const personalizeMessage = (template: string, lead: any) => {
    return template
      .replace('{nome}', lead.name)
      .replace('{empresa}', lead.company);
  };

  const handleSendNow = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum destinatário",
        description: "Selecione pelo menos um lead para enviar a mensagem",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem para enviar",
        variant: "destructive",
      });
      return;
    }

    const recipients = selectedLeads.map(leadId => {
      const lead = leads.find(l => l.id === leadId);
      return lead ? {
        nome: lead.name,
        telefone: lead.phone,
        mensagem: personalizeMessage(message, lead)
      } : null;
    }).filter(Boolean);

    try {
      // Simular envio para webhook
      const response = await fetch('https://webhook-url.com/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipients),
      });

      toast({
        title: "Mensagens enviadas",
        description: `${recipients.length} mensagens foram enviadas com sucesso`,
      });

      setSelectedLeads([]);
      setMessage('');
    } catch (error) {
      toast({
        title: "Erro no envio",
        description: "Erro ao enviar mensagens. Verifique a configuração do webhook.",
        variant: "destructive",
      });
    }
  };

  const handleSchedule = () => {
    if (selectedLeads.length === 0 || !message.trim() || !scheduleDate || !scheduleTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para agendar o envio",
        variant: "destructive",
      });
      return;
    }

    const newScheduled: ScheduledMessage = {
      id: Date.now().toString(),
      recipients: selectedLeads,
      message,
      scheduledFor: `${scheduleDate} ${scheduleTime}`,
      createdAt: new Date().toISOString()
    };

    setScheduledMessages(prev => [...prev, newScheduled]);
    
    toast({
      title: "Envio agendado",
      description: `Mensagem agendada para ${new Date(`${scheduleDate} ${scheduleTime}`).toLocaleString('pt-BR')}`,
    });

    setSelectedLeads([]);
    setMessage('');
    setScheduleDate('');
    setScheduleTime('');
  };

  const removeScheduled = (id: string) => {
    setScheduledMessages(prev => prev.filter(msg => msg.id !== id));
    toast({
      title: "Agendamento removido",
      description: "O envio agendado foi cancelado",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Enviar Mensagens</h2>
        <p className="text-slate-600">Comunique-se com seus leads de forma personalizada e automatizada</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Destinatários ({selectedLeads.length})
            </CardTitle>
            <CardDescription>Selecione os leads para enviar a mensagem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label className="text-sm">Selecionar todos ({filteredLeads.length})</Label>
            </div>

            {/* Lead List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredLeads.map(lead => (
                <div key={lead.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => handleLeadToggle(lead.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{lead.name}</div>
                    <div className="text-xs text-slate-500 truncate">{lead.company}</div>
                    <div className="text-xs text-slate-500">{lead.phone}</div>
                    <Badge variant="outline" className="text-xs mt-1">{lead.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Composer */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Compose Message
            </CardTitle>
            <CardDescription>Crie sua mensagem personalizada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Templates */}
            <div>
              <Label className="text-sm font-medium">Templates Salvos</Label>
              <div className="mt-2 space-y-2">
                {templates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(template)}
                    className="w-full text-left justify-start h-auto p-3 text-wrap"
                  >
                    {template.substring(0, 80)}...
                  </Button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem... Use {nome} e {empresa} para personalizar"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-32"
              />
              <div className="text-xs text-slate-500 mt-1">
                Variáveis disponíveis: {'{nome}'}, {'{empresa}'}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Template
                </Button>
                <Button variant="outline">
                  <Image className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleSendNow} className="bg-gradient-to-r from-green-600 to-green-700">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Agora
                </Button>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button 
                    onClick={handleSchedule} 
                    variant="outline" 
                    className="w-full"
                    disabled={!scheduleDate || !scheduleTime}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Agendar Envio
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Messages */}
      {scheduledMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mensagens Agendadas</CardTitle>
            <CardDescription>Gerencie seus envios programados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledMessages.map(scheduled => (
                <div key={scheduled.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium">
                        {new Date(scheduled.scheduledFor).toLocaleString('pt-BR')}
                      </span>
                      <Badge variant="outline">{scheduled.recipients.length} destinatários</Badge>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{scheduled.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeScheduled(scheduled.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancelar
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
