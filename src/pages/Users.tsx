import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Shield, UserCog, Users as UsersIcon } from 'lucide-react';
import { usersService, CreateUserData, UpdateUserData } from '@/services/usersService';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'comercial';
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
}

export default function Users() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'comercial' as 'admin' | 'supervisor' | 'comercial',
    password: ''
  });

  const roles = [
    { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
    { value: 'supervisor', label: 'Supervisor', description: 'Pode aprovar ações e gerenciar leads' },
    { value: 'comercial', label: 'Comercial', description: 'Pode criar leads e enviar mensagens' }
  ];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAll();
      const typedUsers = data.map(user => ({
        ...user,
        role: user.role as 'admin' | 'supervisor' | 'comercial',
        status: user.status as 'active' | 'inactive'
      }));
      setUsers(typedUsers);
    } catch (error) {
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
    fetchUsers();
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'comercial':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'supervisor':
        return <UserCog className="w-4 h-4" />;
      case 'comercial':
        return <UsersIcon className="w-4 h-4" />;
      default:
        return <UsersIcon className="w-4 h-4" />;
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar o usuário",
        variant: "destructive",
      });
      return;
    }

    try {
      const userData: CreateUserData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password
      };

      await usersService.create(userData);
      await fetchUsers(); // Recarregar lista
      
      setNewUser({ name: '', email: '', role: 'comercial', password: '' });
      setShowAddDialog(false);

      toast({
        title: "Usuário criado",
        description: `${newUser.name} foi adicionado ao sistema`,
      });
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !newUser.name || !newUser.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para atualizar o usuário",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates: UpdateUserData = {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      };

      await usersService.update(editingUser.id, updates);
      await fetchUsers(); // Recarregar lista

      setEditingUser(null);
      setNewUser({ name: '', email: '', role: 'comercial', password: '' });

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) {
      toast({
        title: "Não é possível excluir",
        description: "Deve haver pelo menos um administrador no sistema",
        variant: "destructive",
      });
      return;
    }

    try {
      await usersService.delete(userId);
      await fetchUsers(); // Recarregar lista
      
      toast({
        title: "Usuário removido",
        description: `${user.name} foi removido do sistema`,
      });
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro ao remover usuário",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      await usersService.toggleStatus(userId);
      await fetchUsers(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status do usuário",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciamento de Usuários</h2>
          <p className="text-slate-600">Gerencie o acesso e permissões dos colaboradores</p>
        </div>
        <Dialog open={showAddDialog || !!editingUser} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingUser(null);
            setNewUser({ name: '', email: '', role: 'comercial', password: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Atualize as informações do usuário' : 'Adicione um novo usuário ao sistema'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="role">Perfil *</Label>
                <Select value={newUser.role} onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.value)}
                          <div>
                            <div className="font-medium">{role.label}</div>
                            <div className="text-xs text-slate-500">{role.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!editingUser && (
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingUser(null);
                    setNewUser({ name: '', email: '', role: 'comercial', password: '' });
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={editingUser ? handleUpdateUser : handleAddUser} 
                  className="flex-1"
                >
                  {editingUser ? 'Atualizar' : 'Criar'}
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
            <CardTitle className="text-lg text-blue-900">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{users.length}</div>
            <p className="text-sm text-blue-600">usuários</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-900">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-sm text-red-600">administradores</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-900">Supervisores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {users.filter(u => u.role === 'supervisor').length}
            </div>
            <p className="text-sm text-purple-600">supervisores</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-900">Comerciais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {users.filter(u => u.role === 'comercial').length}
            </div>
            <p className="text-sm text-green-600">comerciais</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>Gerencie todos os usuários do sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-700">Usuário</th>
                  <th className="text-left p-4 font-medium text-slate-700">E-mail</th>
                  <th className="text-left p-4 font-medium text-slate-700">Perfil</th>
                  <th className="text-left p-4 font-medium text-slate-700">Status</th>
                  <th className="text-left p-4 font-medium text-slate-700">Último Acesso</th>
                  <th className="text-left p-4 font-medium text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.name}</div>
                          <div className="text-sm text-slate-500">
                            Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-900">{user.email}</td>
                    <td className="p-4">
                      <Badge className={getRoleColor(user.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {roles.find(r => r.value === user.role)?.label}
                        </div>
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant={user.status === 'active' ? 'default' : 'secondary'}
                        className={user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                          className={user.status === 'active' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {user.status === 'active' ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
