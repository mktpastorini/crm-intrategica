
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1d0029' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white text-lg">Carregando...</p>
        </div>
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

  console.log('Usuário autenticado, renderizando conteúdo');
  return <>{children}</>;
}
