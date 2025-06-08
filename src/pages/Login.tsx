
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { signIn } = useAuth();
  const { settings } = useSystemSettingsDB();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLogging(true);

    console.log('Iniciando processo de login...');

    try {
      await signIn(email, password);
      console.log('Login realizado com sucesso');
      
      toast({
        title: "Login realizado",
        description: "Bem-vindo ao sistema!",
      });
      
      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1000);
      
    } catch (err: any) {
      console.error('Erro no login:', err);
      const errorMessage = err.message || 'Erro ao fazer login';
      setError(errorMessage);
      
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {settings?.logoUrl && (
            <div className="flex justify-center">
              <img 
                src={settings.logoUrl} 
                alt="Logo" 
                className="h-16 w-auto object-contain" 
              />
            </div>
          )}
          <div>
            <CardTitle className="text-2xl font-bold">
              {settings?.systemName || 'Sistema CRM'}
            </CardTitle>
            <CardDescription>
              Faça login para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@admin.com"
                required
                disabled={isLogging}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                required
                disabled={isLogging}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLogging}>
              {isLogging ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isLogging ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-900">Credenciais de teste:</p>
            <p className="text-blue-700">Email: admin@admin.com</p>
            <p className="text-blue-700">Senha: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
