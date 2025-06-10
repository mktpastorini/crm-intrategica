
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Users } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function Messages() {
  const { user, profile } = useAuth();
  const { settings } = useSystemSettingsDB();
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadUsers = async () => {
    try {
      console.log('Carregando usuários para mensagens...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, status')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        throw error;
      }

      console.log('Usuários carregados:', data?.length || 0);
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUserSelection = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      if (checked) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(u => u.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const sendWebhookMessage = async () => {
    if (!settings.messageWebhookUrl) {
      toast({
        title: "Webhook não configurado",
        description: "Configure o webhook de mensagens nas configurações antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (selectedUsers.length === 0) {
      toast({
        title: "Nenhum usuário selecionado",
        description: "Selecione pelo menos um usuário para enviar a mensagem",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem antes de enviar",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      console.log('Enviando mensagem via webhook:', settings.messageWebhookUrl);

      const selectedUsersData = users.filter(u => selectedUsers.includes(u.id));
      
      const webhookData = {
        message: message.trim(),
        users: selectedUsersData,
        sender: {
          id: user?.id,
          name: profile?.name,
          email: user?.email,
          role: profile?.role
        },
        timestamp: new Date().toISOString()
      };

      console.log('Dados do webhook:', webhookData);

      const response = await fetch(settings.messageWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada para ${selectedUsers.length} usuário(s) via webhook`,
      });

      // Limpar formulário
      setMessage('');
      setSelectedUsers([]);

    } catch (error: any) {
      console.error('Erro ao enviar webhook:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Verifique a configuração do webhook e tente novamente",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando mensagens..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mensagens</h2>
        <p className="text-slate-600">Envie mensagens para usuários do sistema</p>
      </div>

      {!settings.messageWebhookUrl && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <p className="text-orange-800">
                <strong>Webhook não configurado:</strong> Configure o webhook de mensagens nas configurações para poder enviar mensagens.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seleção de Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Selecionar Usuários</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={selectAllUsers}>
                Selecionar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Limpar Seleção
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {users.map((userItem) => (
                <div key={userItem.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`user-${userItem.id}`}
                    checked={selectedUsers.includes(userItem.id)}
                    onCheckedChange={(checked) => handleUserSelection(userItem.id, !!checked)}
                  />
                  <label 
                    htmlFor={`user-${userItem.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{userItem.name}</p>
                      <p className="text-sm text-slate-600">
                        {userItem.email} • {userItem.role === 'admin' ? 'Admin' : 
                         userItem.role === 'supervisor' ? 'Supervisor' : 'Comercial'}
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            {selectedUsers.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedUsers.length}</strong> usuário(s) selecionado(s)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Composição da Mensagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Compor Mensagem</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Textarea
                  placeholder="Digite sua mensagem aqui..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>
              
              <Button 
                onClick={sendWebhookMessage}
                disabled={sending || !settings.messageWebhookUrl || selectedUsers.length === 0 || !message.trim()}
                className="w-full"
              >
                {sending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </>
                )}
              </Button>
              
              {!settings.messageWebhookUrl && (
                <p className="text-sm text-red-600">
                  Configure o webhook de mensagens nas configurações para enviar
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum usuário ativo</h3>
            <p className="text-slate-600">Não há usuários ativos para enviar mensagens.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
