
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Edit, Trash2, UserX, Users as UsersIcon, UserCheck } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login?: string;
  avatar_url?: string;
}

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'comercial',
    status: 'active'
  });

  const loadUsers = async () => {
    try {
      console.log('Carregando usuários...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setActionLoading('submit');
      
      if (editingUser) {
        console.log('Atualizando usuário:', editingUser.id, formData);
        
        const { data, error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            role: formData.role,
            status: formData.status
          })
          .eq('id', editingUser.id)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar usuário:', error);
          throw error;
        }

        console.log('Usuário atualizado:', data);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? data : u));

        toast({
          title: "Usuário atualizado",
          description: "Usuário foi atualizado com sucesso",
        });
      } else {
        console.log('Criando novo usuário:', formData);

        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: formData.role,
              status: formData.status
            }
          }
        });

        if (authError) {
          console.error('Erro ao criar usuário no Auth:', authError);
          throw authError;
        }

        console.log('Usuário criado no Auth:', authData);

        // Aguardar um pouco para o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se o perfil foi criado e atualizar com o status correto
        if (authData.user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              name: formData.name,
              role: formData.role,
              status: formData.status
            })
            .eq('id', authData.user.id);

          if (updateError) {
            console.error('Erro ao atualizar perfil criado:', updateError);
          }
        }

        // Recarregar a lista
        await loadUsers();

        toast({
          title: "Usuário criado",
          description: "Usuário foi criado com sucesso",
        });
      }

      handleCloseDialog();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (user: User) => {
    console.log('Editando usuário:', user);
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    });
    setShowAddDialog(true);
  };

  const handleActivate = async (userId: string) => {
    try {
      console.log('Ativando usuário:', userId);
      setActionLoading(`activate-${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao ativar usuário:', error);
        throw error;
      }

      console.log('Usuário ativado:', data);
      setUsers(prev => prev.map(u => u.id === userId ? data : u));

      toast({
        title: "Usuário ativado",
        description: "Usuário foi ativado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao ativar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao ativar usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este usuário?')) return;

    try {
      console.log('Desativando usuário:', userId);
      setActionLoading(`deactivate-${userId}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao desativar usuário:', error);
        throw error;
      }

      console.log('Usuário desativado:', data);
      setUsers(prev => prev.map(u => u.id === userId ? data : u));

      toast({
        title: "Usuário desativado",
        description: "Usuário foi desativado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao desativar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao desativar usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja EXCLUIR permanentemente este usuário? Esta ação não pode ser desfeita.')) return;

    try {
      console.log('Excluindo usuário:', userId);
      setActionLoading(`delete-${userId}`);
      
      // Primeiro, exclua o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Erro ao excluir perfil:', profileError);
        throw profileError;
      }

      // Remove da lista local
      setUsers(prev => prev.filter(u => u.id !== userId));

      toast({
        title: "Usuário excluído",
        description: "Usuário foi excluído permanentemente",
      });
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'comercial',
      status: 'active'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'comercial': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando usuários..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Usuários</h2>
          <p className="text-slate-600">Gerencie os usuários do sistema</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Edite as informações do usuário' : 'Adicione um novo usuário ao sistema'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!!editingUser}
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1" disabled={actionLoading === 'submit'}>
                  {actionLoading === 'submit' ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    editingUser ? 'Atualizar' : 'Criar Usuário'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((userItem) => (
          <Card key={userItem.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    {userItem.avatar_url ? (
                      <AvatarImage src={userItem.avatar_url} alt={userItem.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-medium">
                      {userItem.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{userItem.name}</h3>
                    <p className="text-slate-600">{userItem.email}</p>
                    <div className="flex space-x-2 mt-2">
                      <Badge className={getRoleBadgeColor(userItem.role)}>
                        {userItem.role === 'admin' ? 'Administrador' : 
                         userItem.role === 'supervisor' ? 'Supervisor' : 'Comercial'}
                      </Badge>
                      <Badge className={getStatusBadgeColor(userItem.status)}>
                        {userItem.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(userItem)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  {userItem.status === 'active' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeactivate(userItem.id)}
                      className="text-orange-600 hover:text-orange-700"
                      disabled={actionLoading === `deactivate-${userItem.id}`}
                    >
                      {actionLoading === `deactivate-${userItem.id}` ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <UserX className="w-4 h-4" />
                      )}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleActivate(userItem.id)}
                      className="text-green-600 hover:text-green-700"
                      disabled={actionLoading === `activate-${userItem.id}`}
                    >
                      {actionLoading === `activate-${userItem.id}` ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(userItem.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={actionLoading === `delete-${userItem.id}`}
                  >
                    {actionLoading === `delete-${userItem.id}` ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-slate-600">Comece adicionando um novo usuário ao sistema.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
