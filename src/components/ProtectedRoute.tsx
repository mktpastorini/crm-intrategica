
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  console.log('ProtectedRoute - Estado:', { 
    user: !!user, 
    profile: !!profile, 
    loading,
    userRole: profile?.role
  });

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  // Se não há usuário, redirecionar para login
  if (!user) {
    console.log('Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  // Verificar permissões de role se necessário
  if (requiredRole && profile && !requiredRole.includes(profile.role || '')) {
    console.log('Usuário sem permissão para esta rota, redirecionando');
    return <Navigate to="/" replace />;
  }

  // Usuários comerciais não podem acessar a página de Supervisão
  if (window.location.pathname === '/supervision' && profile?.role === 'comercial') {
    console.log('Usuário comercial tentou acessar supervisão, redirecionando');
    return <Navigate to="/" replace />;
  }

  // Pipeline é liberado para todos os usuários autenticados
  if (window.location.pathname === '/pipeline') {
    console.log('Acesso ao pipeline liberado para todos os usuários');
    return <>{children}</>;
  }

  console.log('Usuário autenticado, renderizando conteúdo');
  return <>{children}</>;
}
