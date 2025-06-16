
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
    userRole: profile?.role,
    currentPath: window.location.pathname
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

  // Se há usuário mas não há perfil, ainda tentar renderizar (perfil pode não ser obrigatório)
  // Só verificar role se há perfil
  if (requiredRole && profile && !requiredRole.includes(profile.role || '')) {
    console.log('Usuário sem permissão para esta rota, redirecionando');
    return <Navigate to="/" replace />;
  }

  // Verificação específica para supervisão
  if (window.location.pathname === '/supervision' && profile?.role === 'comercial') {
    console.log('Usuário comercial tentou acessar supervisão, redirecionando');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('Usuário autenticado, renderizando conteúdo');
  return <>{children}</>;
}
