
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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    console.log('Inicializando autenticação...');
    
    let mounted = true;

    const initAuth = async () => {
      try {
        // Configurar listener primeiro
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id);
          
          if (!mounted) return;

          if (session?.user) {
            setUser(session.user);
            // Carregar perfil de forma assíncrona
            setTimeout(async () => {
              if (mounted) {
                await loadUserProfile(session.user.id);
              }
            }, 0);
          } else {
            setUser(null);
            setProfile(null);
          }
          
          if (mounted) {
            setLoading(false);
          }
        });

        // Verificar sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
        } else if (session?.user && mounted) {
          console.log('Sessão encontrada:', session.user.id);
          setUser(session.user);
          await loadUserProfile(session.user.id);
        }

        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [initialized]);

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
        setProfile(null);
        return;
      }
      
      console.log('Perfil carregado:', data);
      setProfile(data);
    } catch (error) {
      console.error('Erro inesperado ao buscar perfil:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Tentando fazer login com:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }
      
      console.log('Login bem-sucedido:', data.user?.id);
      return data;
    } catch (error) {
      console.error('Erro no signIn:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      return { success: true };
    } catch (error: any) {
      console.error('Erro no login wrapper:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    console.log('Fazendo logout');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no logout:', error);
        throw error;
      }
      
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
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
