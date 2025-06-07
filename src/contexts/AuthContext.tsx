
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadUserProfile = async (userId: string) => {
      try {
        console.log('Carregando perfil para usuário:', userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Erro ao carregar perfil:', error);
          if (mounted) setProfile(null);
          return;
        }
        
        if (mounted && data) {
          console.log('Perfil carregado:', data);
          setProfile(data);
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar perfil:', error);
        if (mounted) setProfile(null);
      }
    };

    const initAuth = async () => {
      try {
        console.log('AuthProvider: Inicializando autenticação');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
        }
        
        if (mounted) {
          const currentUser = session?.user || null;
          console.log('Sessão atual:', currentUser?.id || 'nenhuma');
          
          setUser(currentUser);
          
          if (currentUser) {
            await loadUserProfile(currentUser.id);
          } else {
            setProfile(null);
          }
          
          // IMPORTANTE: Sempre setar loading como false no final
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id || 'sem usuário');
      
      if (!mounted) return;

      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await loadUserProfile(currentUser.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      
      // Garantir que loading seja false após eventos de auth
      setLoading(false);
    });

    // Initialize
    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const login = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const logout = async () => {
    await signOut();
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    signIn,
    signOut,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
