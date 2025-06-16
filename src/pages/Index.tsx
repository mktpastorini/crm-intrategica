
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Se usuário está logado, redireciona para dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // Se usuário não está logado, redireciona para login
        navigate('/login', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  // Fallback - não deveria chegar aqui normalmente
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Bem vindo a Intratégica</h1>
        <p className="text-xl text-gray-600">Redirecionando...</p>
      </div>
    </div>
  );
};

export default Index;
