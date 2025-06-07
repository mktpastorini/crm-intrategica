
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, profile, loading } = useAuth();

  console.log('ProtectedRoute - Estado:', { loading, isAuthenticated, profile: profile?.role });

  // Mostrar loading apenas durante verificação inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, redirecionar para login
  if (!isAuthenticated) {
    console.log('Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  // Verificar permissões de role se necessário
  if (requiredRole && profile && !requiredRole.includes(profile.role || '')) {
    console.log('Usuário sem permissão para esta rota, redirecionando');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
