
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, MessageSquare, Phone, Mail, Send } from 'lucide-react';
import { useCrm } from '@/contexts/CrmContext';

export default function Messages() {
  const { leads, profiles } = useCrm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newMessage, setNewMessage] = useState({
    leadId: '',
    type: 'whatsapp' as 'whatsapp' | 'email' | 'call',
    subject: '',
    content: ''
  });

  // Mock messages data - in a real app this would come from a database
  const [messages] = useState([
    {
      id: '1',
      leadId: leads[0]?.id || '1',
      leadName: leads[0]?.name || 'João Silva',
      company: leads[0]?.company || 'TechCorp',
      type: 'whatsapp' as const,
      subject: 'Apresentação da proposta',
      content: 'Olá! Gostaria de agendar uma reunião para apresentar nossa proposta comercial.',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'sent',
      response: 'Perfeito! Podemos marcar para quinta-feira às 14h?'
    },
    {
      id: '2',
      leadId: leads[1]?.id || '2',
      leadName: leads[1]?.name || 'Maria Santos',
      company: leads[1]?.company || 'InnovateCorp',
      type: 'email' as const,
      subject: 'Proposta comercial - Soluções digitais',
      content: 'Prezada Maria, conforme nossa conversa, segue em anexo nossa proposta para implementação das soluções digitais.',
      timestamp: '2024-01-14T15:45:00Z',
      status: 'delivered',
      response: null
    }
  ]);

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendMessage = () => {
    // In a real app, this would send the message via API
    console.log('Enviando mensagem:', newMessage);
    setNewMessage({ leadId: '', type: 'whatsapp', subject: '', content: '' });
    setShowNewMessageDialog(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'call':
        return <Phone className="w-4 h-4 text-orange-600" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
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
          <p className="text-slate-600">Gerencie todas as comunicações com seus leads</p>
        </div>
        <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Mensagem</DialogTitle>
              <DialogDescription>
                Envie uma mensagem para um lead
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Lead</label>
                <Select value={newMessage.leadId} onValueChange={(value) => setNewMessage(prev => ({ ...prev, leadId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select value={newMessage.type} onValueChange={(value: 'whatsapp' | 'email' | 'call') => setNewMessage(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="call">Ligação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Assunto</label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Assunto da mensagem"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mensagem</label>
                <Textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNewMessageDialog(false)} className="flex-1">
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por lead ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="read">Lido</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(message.type)}
                    <div>
                      <h3 className="font-semibold text-slate-900">{message.leadName}</h3>
                      <p className="text-sm text-slate-600">{message.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(message.status)}>
                      {message.status === 'sent' ? 'Enviado' :
                       message.status === 'delivered' ? 'Entregue' :
                       message.status === 'read' ? 'Lido' : 'Falhou'}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {new Date(message.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">{message.subject}</h4>
                    <p className="text-slate-700">{message.content}</p>
                  </div>
                  
                  {message.response && (
                    <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-slate-900 mb-1">Resposta:</p>
                      <p className="text-slate-700">{message.response}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma mensagem encontrada</h3>
              <p className="text-slate-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece enviando sua primeira mensagem para um lead'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
