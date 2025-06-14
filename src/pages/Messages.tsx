
import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageSquare, Send, Filter, Search, Users as UsersIcon } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import MessagesTable from '@/components/messages/MessagesTable';
import UserSelector from '@/components/leads/UserSelector';
import LeadsTable from '@/components/leads/LeadsTable';
import MessageVariables from '@/components/messages/MessageVariables';

interface Message {
  id: string;
  recipient_id: string;
  message: string;
  sent_at: string;
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company: string;
  niche: string;
  status: string;
  responsible_id: string;
  created_at: string;
  website?: string;
  address?: string;
  rating?: number;
  place_id?: string;
  whatsapp?: string;
}

export default function Messages() {
  const { users } = useCrm();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [formData, setFormData] = useState({
    recipient_id: '',
    message: ''
  });

  const handleInsertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      message: prev.message + variable
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações básicas
      if (!formData.recipient_id.trim()) {
        toast({
          title: "Erro de validação",
          description: "Destinatário é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!formData.message.trim()) {
        toast({
          title: "Erro de validação",
          description: "Mensagem é obrigatória",
          variant: "destructive",
        });
        return;
      }

      // Simulação de envio de mensagem
      setActionLoading('send-message');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Limpar formulário e fechar diálogo
      setFormData({
        recipient_id: '',
        message: ''
      });
      setShowDialog(false);

      toast({
        title: "Mensagem enviada",
        description: "Mensagem enviada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRecipient = recipientFilter === 'all' || message.recipient_id === recipientFilter;
    
    return matchesSearch && matchesRecipient;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando mensagens..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mensagens</h2>
          <p className="text-slate-600">Gerencie o envio de mensagens para seus leads</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Mensagem</DialogTitle>
              <DialogDescription>
                Envie mensagens personalizadas para seus leads usando variáveis
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Digite sua mensagem aqui..."
                  rows={4}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use variáveis como {'{{nome}}'}, {'{{empresa}}'}, {'{{email}}'} que serão substituídas pelos dados do lead
                </p>
              </div>

              {/* Seção de variáveis inline */}
              <div className="bg-slate-50 p-3 rounded-lg">
                <Label className="text-sm font-medium">Variáveis disponíveis:</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {['{{nome}}', '{{empresa}}', '{{email}}', '{{telefone}}', '{{whatsapp}}'].map((variable) => (
                    <Button
                      key={variable}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInsertVariable(variable)}
                      className="text-xs h-7"
                    >
                      {variable}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="recipient">Destinatário</Label>
                <Select value={formData.recipient_id} onValueChange={(value) => setFormData(prev => ({ ...prev, recipient_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar destinatário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={actionLoading === 'send-message'}>
                  {actionLoading === 'send-message' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      Enviar Mensagem
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Componente de variáveis */}
      <MessageVariables onInsertVariable={handleInsertVariable} />

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por mensagem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="recipient-filter">Destinatário</Label>
              <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todos os destinatários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os destinatários</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setRecipientFilter('all');
              }}
              size="icon"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{messages.length}</div>
            <p className="text-sm text-slate-600">Total de Mensagens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {messages.filter(m => m.recipient_id === user?.id).length}
            </div>
            <p className="text-sm text-slate-600">Enviadas por mim</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {messages.filter(m => m.recipient_id !== user?.id).length}
            </div>
            <p className="text-sm text-slate-600">Recebidas por mim</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Mensagens */}
      {filteredMessages.length > 0 ? (
        <MessagesTable
          messages={filteredMessages}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm || recipientFilter !== 'all' ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem enviada'}
            </h3>
            <p className="text-slate-600">
              {searchTerm || recipientFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece enviando uma nova mensagem.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
