
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'comercial';
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Carregando perfil do usuário:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return null;
      }

      if (profile) {
        console.log('Perfil carregado com sucesso:', profile);
        const userProfile = {
          ...profile,
          role: profile.role as 'admin' | 'supervisor' | 'comercial',
          status: profile.status as 'active' | 'inactive'
        };
        return userProfile;
      }

      console.log('Nenhum perfil encontrado para o usuário:', userId);
      return null;
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Inicializando autenticação...');

        // Configurar listener de mudanças de estado
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id);
          
          if (!mounted) return;

          if (session?.user) {
            console.log('Usuário logado, carregando perfil...');
            setSession(session);
            
            // Carregar perfil do usuário
            const profile = await loadUserProfile(session.user.id);
            if (profile && mounted) {
              setUser(profile);
              console.log('Perfil definido:', profile);
            } else if (mounted) {
              console.log('Perfil não encontrado, fazendo logout...');
              setUser(null);
              setSession(null);
            }
          } else {
            console.log('Usuário não logado');
            setSession(null);
            setUser(null);
          }
          
          if (mounted) {
            setLoading(false);
          }
        });

        // Verificar sessão existente
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('Sessão atual:', currentSession?.user?.id || 'Nenhuma');

        // Se não há sessão, apenas definir loading como false
        if (!currentSession && mounted) {
          setLoading(false);
        }

        return () => {
          console.log('Limpando subscription');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Tentativa de login para:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro de autenticação:', error);
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        console.log('Login bem-sucedido para usuário:', data.user.id);
        
        // Tentar atualizar último login (não bloquear se falhar)
        try {
          await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        } catch (updateError) {
          console.error('Erro ao atualizar último login (não crítico):', updateError);
        }

        // O estado será atualizado pelo onAuthStateChange
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Dados de usuário inválidos' };
    } catch (error) {
      console.error('Erro durante login:', error);
      setLoading(false);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const logout = async () => {
    try {
      console.log('Fazendo logout...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
      }
      
      // Limpar estado local
      setUser(null);
      setSession(null);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setLoading(false);
    }
  };

  const isAuthenticated = !!user && !!session && user.status === 'active';

  console.log('AuthProvider state:', {
    hasUser: !!user,
    hasSession: !!session,
    userStatus: user?.status,
    isAuthenticated,
    loading
  });

  return (
    <AuthContext.Provider value={{
      user,
      session,
      login,
      logout,
      isAuthenticated,
      loading
    }}>
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
