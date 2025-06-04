
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  content: string;
  type: 'whatsapp' | 'email' | 'sms';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt: string;
  sentBy: string;
}

export default function Messages() {
  const { toast } = useToast();
  const { leads, profiles } = useCrm();
  const { user, profile } = useAuth();
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState('');
  const [messageType, setMessageType] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [messageContent, setMessageContent] = useState('');

  // Mock messages data - in a real app this would come from the database
  const [messages] = useState<Message[]>([
    {
      id: '1',
      leadId: 'lead1',
      leadName: 'João Silva',
      company: 'Tech Solutions',
      content: 'Olá João, tudo bem? Gostaria de agendar uma reunião para apresentar nossa proposta...',
      type: 'whatsapp',
      status: 'delivered',
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sentBy: profile?.name || 'Usuário'
    },
    {
      id: '2',
      leadId: 'lead2',
      leadName: 'Maria Santos',
      company: 'Inovação Digital',
      content: 'Prezada Maria, segue em anexo nossa proposta comercial conforme solicitado...',
      type: 'email',
      status: 'sent',
      sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      sentBy: profile?.name || 'Usuário'
    }
  ]);

  const handleSendMessage = () => {
    if (!selectedLead || !messageContent.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um lead e digite uma mensagem",
        variant: "destructive",
      });
      return;
    }

    const lead = leads.find(l => l.id === selectedLead);
    if (!lead) return;

    // Here you would integrate with your messaging service
    // For now, we'll just show a success message
    toast({
      title: "Mensagem enviada",
      description: `Mensagem enviada para ${lead.name} via ${messageType}`,
    });

    setSelectedLead('');
    setMessageContent('');
    setShowComposeDialog(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'sent':
        return <Send className="w-4 h-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'sent':
        return 'Enviada';
      case 'delivered':
        return 'Entregue';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return '📱';
      case 'email':
        return '📧';
      case 'sms':
        return '💬';
      default:
        return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return 'bg-green-100 text-green-800';
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'sms':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Central de Mensagens</h2>
          <p className="text-slate-600">Envie mensagens para seus leads via WhatsApp, E-mail ou SMS</p>
        </div>
        <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Compor Mensagem</DialogTitle>
              <DialogDescription>
                Envie uma mensagem personalizada para um lead
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lead">Destinatário *</Label>
                <Select value={selectedLead} onValueChange={setSelectedLead}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        <div className="flex items-center space-x-2">
                          <span>{lead.name}</span>
                          <span className="text-sm text-slate-500">- {lead.company}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Tipo de Mensagem *</Label>
                <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                    <SelectItem value="email">📧 E-mail</SelectItem>
                    <SelectItem value="sms">💬 SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Mensagem *</Label>
                <Textarea
                  id="content"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={4}
                />
                <div className="text-sm text-slate-500 mt-1">
                  {messageContent.length}/500 caracteres
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowComposeDialog(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSendMessage} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900">Total Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{messages.length}</div>
            <p className="text-sm text-blue-600">mensagens enviadas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-900">Entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {messages.filter(m => m.status === 'delivered').length}
            </div>
            <p className="text-sm text-green-600">mensagens entregues</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-yellow-900">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">
              {messages.filter(m => m.status === 'pending').length}
            </div>
            <p className="text-sm text-yellow-600">aguardando envio</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-900">Falharam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {messages.filter(m => m.status === 'failed').length}
            </div>
            <p className="text-sm text-red-600">erro no envio</p>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensagens</CardTitle>
          <CardDescription>Todas as mensagens enviadas recentemente</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-700">Lead</th>
                  <th className="text-left p-4 font-medium text-slate-700">Tipo</th>
                  <th className="text-left p-4 font-medium text-slate-700">Mensagem</th>
                  <th className="text-left p-4 font-medium text-slate-700">Status</th>
                  <th className="text-left p-4 font-medium text-slate-700">Enviado por</th>
                  <th className="text-left p-4 font-medium text-slate-700">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {messages.map((message) => (
                  <tr key={message.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-slate-900">{message.leadName}</div>
                        <div className="text-sm text-slate-500">{message.company}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getTypeColor(message.type)}>
                        {getTypeIcon(message.type)} {message.type.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-slate-700 truncate">
                          {message.content}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(message.status)}
                        <Badge className={getStatusColor(message.status)}>
                          {getStatusLabel(message.status)}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <User className="w-3 h-3 mr-1" />
                        {message.sentBy}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(message.sentAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma mensagem enviada</h3>
              <p className="text-slate-600">Comece enviando sua primeira mensagem</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
