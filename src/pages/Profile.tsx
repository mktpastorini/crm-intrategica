
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Profile() {
  const { user, profile, updateProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Atualizar formData quando o profile carregar
  useEffect(() => {
    if (profile?.name) {
      setFormData(prev => ({
        ...prev,
        name: profile.name
      }));
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Atualizando perfil:', formData);
      
      // Update profile
      await updateProfile({
        name: formData.name,
        ...(formData.newPassword && { password: formData.newPassword })
      });

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      });

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Apenas arquivos de imagem são permitidos",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Uploading avatar...');
      
      // Convert to base64 for simple storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const avatarUrl = e.target?.result as string;
        
        try {
          await updateProfile({ avatar_url: avatarUrl });
          toast({
            title: "Foto atualizada",
            description: "Sua foto de perfil foi atualizada com sucesso",
          });
        } catch (error: any) {
          console.error('Erro ao atualizar foto:', error);
          toast({
            title: "Erro",
            description: error.message || "Erro ao atualizar foto",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      setLoading(false);
      console.error('Erro ao processar imagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar imagem",
        variant: "destructive",
      });
    }
  };

  // Mostrar loading enquanto o contexto está carregando
  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Carregando perfil..." />
        </div>
      </div>
    );
  }

  // Verificar se usuário e perfil existem
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Erro ao carregar perfil</h3>
            <p className="text-slate-600">Usuário não encontrado. Tente fazer login novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não há profile ainda, mas temos user, mostrar loading
  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Carregando dados do perfil..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Perfil do Usuário</h2>
        <p className="text-slate-600">Gerencie suas informações pessoais e configurações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Photo Upload Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
              ) : null}
              <AvatarFallback className="text-xl bg-slate-200">
                {profile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Alterar Foto</span>
              </Button>
              <p className="text-xs text-slate-500 mt-1">
                JPG, PNG até 5MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

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
                value={user?.email || ''}
                disabled
                className="bg-slate-100"
              />
              <p className="text-xs text-slate-500 mt-1">
                O email não pode ser alterado
              </p>
            </div>

            <div>
              <Label htmlFor="role">Função</Label>
              <Input
                id="role"
                value={profile?.role === 'admin' ? 'Administrador' : 
                       profile?.role === 'supervisor' ? 'Supervisor' : 'Comercial'}
                disabled
                className="bg-slate-100"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Deixe em branco para manter a senha atual"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
