
import { Navigate } from 'react-router-dom';
import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          setIsAuthenticated(true);
          
          // Load user profile for role checking
          if (requiredRole) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (mounted) {
              setUserProfile(profile);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (mounted) {
          setLoading(false);
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions
  if (requiredRole && userProfile && !requiredRole.includes(userProfile.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
