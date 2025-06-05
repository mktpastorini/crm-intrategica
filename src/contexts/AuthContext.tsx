
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

  // Limpar cache antigo na inicialização
  useEffect(() => {
    if (!initialized) {
      // Limpar dados antigos do localStorage que agora estão no Supabase
      const keysToRemove = [
        'leads',
        'events', 
        'systemSettings',
        'leadStatuses',
        'messageTemplates',
        'scheduledMessages'
      ];
      
      keysToRemove.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          console.log(`Limpando cache antigo: ${key}`);
          localStorage.removeItem(key);
        }
      });

      console.log('Cache limpo com sucesso');
      setInitialized(true);
    }
  }, [initialized]);

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
      } else {
        console.log('Perfil carregado:', data);
        return data;
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Iniciando configuração de autenticação');
    
    let mounted = true;

    // Configurar listener de auth primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (!mounted) return;

      if (session?.user) {
        setSession(session);
        setUser(session.user);
        
        // Carregar perfil do usuário em background
        const userProfile = await loadUserProfile(session.user.id);
        if (mounted) {
          setProfile(userProfile);
          setLoading(false);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Verificar sessão atual
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('Sessão inicial:', session?.user?.id);
        
        if (session?.user && mounted) {
          setSession(session);
          setUser(session.user);
          
          const userProfile = await loadUserProfile(session.user.id);
          if (mounted) {
            setProfile(userProfile);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro na inicialização de auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
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
      setLoading(false);
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
      setLoading(true);
      console.log('Fazendo logout...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        throw error;
      }

      console.log('Logout bem-sucedido');
      
      // Limpar dados locais
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Opcional: limpar localStorage específico se necessário
      localStorage.removeItem('pendingActions');
      localStorage.removeItem('pipelineStages');
      
    } catch (error) {
      console.error('Erro durante o logout:', error);
      throw error;
    } finally {
      setLoading(false);
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
