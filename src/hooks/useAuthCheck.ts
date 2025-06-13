
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface UseAuthCheckOptions {
  requiredRole?: string[];
  redirectTo?: string;
}

export function useAuthCheck({ requiredRole, redirectTo = '/login' }: UseAuthCheckOptions = {}) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      console.log('User not authenticated, redirecting to login');
      navigate(redirectTo);
      return;
    }

    if (requiredRole && profile && !requiredRole.includes(profile.role || '')) {
      console.log('User lacks required role, access denied');
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta funcionalidade",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [user, profile, loading, requiredRole, navigate, redirectTo, toast]);

  return {
    isAuthenticated: !!user,
    hasRequiredRole: !requiredRole || (profile && requiredRole.includes(profile.role || '')),
    isLoading: loading
  };
}
