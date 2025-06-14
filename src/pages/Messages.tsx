
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
import { MessageSquare, Send, Filter, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmojiPicker from '@/components/messages/EmojiPicker';
import MessageTemplates from '@/components/messages/MessageTemplates';
import MessageVariables from '@/components/messages/MessageVariables';

interface Message {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_type: 'lead' | 'user';
  message: string;
  sent_at: string;
}

export default function Messages() {
  const { leads, users } = useCrm();
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
    const textarea = document.getElementById('message') as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const newMessage = formData.message.substring(0, startPos) + variable + formData.message.substring(endPos);
      setFormData(prev => ({ ...prev, message: newMessage }));
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(startPos + variable.length, startPos + variable.length);
      }, 0);
    } else {
      setFormData(prev => ({ ...prev, message: prev.message + variable }));
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    const textarea = document.getElementById('message') as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const newMessage = formData.message.substring(0, startPos) + emoji + formData.message.substring(endPos);
      setFormData(prev => ({ ...prev, message: newMessage }));
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(startPos + emoji.length, startPos + emoji.length);
      }, 0);
    } else {
      setFormData(prev => ({ ...prev, message: prev.message + emoji }));
    }
  };

  const handleTemplateLoad = (content: string) => {
    setFormData(prev => ({ ...prev, message: content }));
  };

  const processMessage = (message: string, recipient: any) => {
    let processedMessage = message;
    
    processedMessage = processedMessage
      .replace(/\{\{nome\}\}/g, recipient?.name || '')
      .replace(/\{\{empresa\}\}/g, recipient?.company || '')
      .replace(/\{\{email\}\}/g, recipient?.email || '')
      .replace(/\{\{telefone\}\}/g, recipient?.phone || '')
      .replace(/\{\{whatsapp\}\}/g, recipient?.whatsapp || '')
      .replace(/\{\{website\}\}/g, recipient?.website || '')
      .replace(/\{\{endereco\}\}/g, recipient?.address || '')
      .replace(/\{\{nicho\}\}/g, recipient?.niche || '');
    
    return processedMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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

      setActionLoading('send-message');

      // Buscar dados do lead
      const recipient = leads.find(lead => lead.id === formData.recipient_id);
      const recipientName = recipient?.name || 'Lead não encontrado';

      // Processar mensagem com variáveis
      const processedMessage = processMessage(formData.message, recipient);

      // Simular envio da mensagem
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Adicionar mensagem à lista local
      const newMessage: Message = {
        id: crypto.randomUUID(),
        recipient_id: formData.recipient_id,
        recipient_name: recipientName,
        recipient_type: 'lead',
        message: processedMessage,
        sent_at: new Date().toISOString(),
      };

      setMessages(prev => [newMessage, ...prev]);

      // Limpar formulário e fechar diálogo
      setFormData({
        recipient_id: '',
        message: ''
      });
      setShowDialog(false);

      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada para ${recipientName} com sucesso`,
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
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.recipient_name.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <p className="text-slate-600">Envie mensagens personalizadas para seus leads</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Mensagem</DialogTitle>
              <DialogDescription>
                Envie mensagens personalizadas usando variáveis que serão substituídas pelos dados reais do lead
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="recipient">Destinatário (Lead)</Label>
                <Select value={formData.recipient_id} onValueChange={(value) => setFormData(prev => ({ ...prev, recipient_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} {lead.company ? `- ${lead.company}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Digite sua mensagem aqui..."
                  rows={6}
                  required
                />
              </div>

              {/* Ferramentas de edição */}
              <div className="flex flex-wrap gap-2 items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <EmojiPicker onEmojiSelect={handleInsertEmoji} />
                  <MessageTemplates 
                    currentMessage={formData.message}
                    onTemplateLoad={handleTemplateLoad}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Dica:</strong> As variáveis como {{nome}}, {{empresa}}, etc. serão substituídas automaticamente pelos dados do lead selecionado.
                </p>
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

            {/* Variáveis disponíveis - lado direito */}
            <div className="mt-4">
              <MessageVariables onInsertVariable={handleInsertVariable} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
                  placeholder="Buscar por mensagem ou destinatário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
              {messages.filter(m => m.recipient_type === 'lead').length}
            </div>
            <p className="text-sm text-slate-600">Enviadas para Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {messages.length > 0 ? messages.length : 0}
            </div>
            <p className="text-sm text-slate-600">Mensagens Hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Mensagens */}
      {filteredMessages.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Mensagens Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div key={message.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900">{message.recipient_name}</h4>
                      <Badge variant="default">Lead</Badge>
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(message.sent_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{message.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem enviada'}
            </h3>
            <p className="text-slate-600">
              {searchTerm 
                ? 'Tente ajustar o termo de busca.' 
                : 'Comece enviando uma nova mensagem.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
