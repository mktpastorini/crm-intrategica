
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn } from 'lucide-react';

export default function Login() {
  const { signIn, loading } = useAuth();
  const { settings } = useSystemSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLogging(true);

    console.log('Tentando fazer login...');

    try {
      await signIn(email, password);
      console.log('Login realizado com sucesso');
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLogging(false);
    }
  };

  const isSubmitting = loading || isLogging;

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
                placeholder="seu@email.com"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          {/* Informações de debug em desenvolvimento */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <p>Debug: URL Supabase: {import.meta.env.VITE_SUPABASE_URL || 'Não configurada'}</p>
              <p>Debug: Anon Key presente: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Sim' : 'Não'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
