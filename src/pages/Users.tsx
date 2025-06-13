import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { secureUsersService } from '@/services/secureUsersService';
import { inputValidation } from '@/utils/inputValidation';
import { useAuthCheck } from '@/hooks/useAuthCheck';

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'comercial',
    status: 'active'
  });

  // Check if user has admin access
  const { isAuthenticated, hasRequiredRole, isLoading: authLoading } = useAuthCheck({ 
    requiredRole: ['admin'] 
  });

  const loadUsers = async () => {
    try {
      console.log('Carregando usuários...');
      setLoading(true);
      
      const data = await secureUsersService.getAll();
      console.log('Usuários carregados:', data?.length || 0);
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRequiredRole) {
      loadUsers();
    }
  }, [hasRequiredRole]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!inputValidation.validateRequired(formData.name)) {
      errors.name = 'Nome é obrigatório';
    }

    if (!inputValidation.validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!editingUser && !inputValidation.validateLength(formData.password, 6, 100)) {
      errors.password = 'Senha deve ter entre 6 e 100 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    const sanitizedValue = inputValidation.sanitizeHtml(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros no formulário antes de continuar",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setActionLoading('submit');
      
      if (editingUser) {
        console.log('Atualizando usuário:', editingUser.id, formData);
        await secureUsersService.update(editingUser.id, {
          name: formData.name,
          role: formData.role as any,
          status: formData.status as any
        });

        toast({
          title: "Usuário atualizado",
          description: "Usuário foi atualizado com sucesso",
        });
      } else {
        console.log('Criando novo usuário:', formData);
        await secureUsersService.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role as any
        });

        toast({
          title: "Usuário criado",
          description: `Usuário foi criado com status ${formData.status}`,
        });
      }

      handleCloseDialog();
      await loadUsers();
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
      
      await secureUsersService.toggleStatus(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));

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
      
      await secureUsersService.toggleStatus(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'inactive' } : u));

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
      
      await secureUsersService.delete(userId);
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
    setFormErrors({});
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando usuários..." />
      </div>
    );
  }

  if (!isAuthenticated || !hasRequiredRole) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Acesso Restrito</h3>
          <p className="text-slate-600">Você precisa ser administrador para gerenciar usuários.</p>
        </CardContent>
      </Card>
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
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={formErrors.name ? 'border-red-500' : ''}
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={formErrors.email ? 'border-red-500' : ''}
                  disabled={!!editingUser}
                  required
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>
              {!editingUser && (
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={formErrors.password ? 'border-red-500' : ''}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                  )}
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
