
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
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil do usuário:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return null;
      }
      
      console.log('Perfil carregado:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    if (initialized) return;
    
    console.log('AuthProvider: Inicializando autenticação');
    
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Configurar listener de mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('Auth state change:', event, newSession?.user?.id);
          
          if (!isMounted) return;

          if (newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            
            // Carregar perfil apenas se mudou o usuário
            if (!profile || profile.id !== newSession.user.id) {
              try {
                const userProfile = await loadUserProfile(newSession.user.id);
                if (isMounted) {
                  setProfile(userProfile);
                }
              } catch (error) {
                console.error('Erro ao carregar perfil:', error);
              }
            }
          } else {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          
          if (isMounted) {
            setLoading(false);
          }
        });

        // Verificar sessão atual
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession && isMounted) {
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro na inicialização de auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();
    setInitialized(true);

    return () => {
      isMounted = false;
    };
  }, []); // Array vazio - executar apenas uma vez

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login com:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }

      console.log('Login bem-sucedido:', data);
    } catch (error) {
      console.error('Erro durante o login:', error);
      throw error;
    }
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
    try {
      console.log('Fazendo logout...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        throw error;
      }

      console.log('Logout bem-sucedido');
    } catch (error) {
      console.error('Erro durante o logout:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut();
  };

  const isAuthenticated = !!session && !!user;

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
