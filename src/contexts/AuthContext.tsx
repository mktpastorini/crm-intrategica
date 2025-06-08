
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
    console.log('AuthProvider: Inicializando autenticação');
    
    // Verificar sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão inicial:', error);
          setLoading(false);
          return;
        }

        console.log('Sessão inicial encontrada:', session?.user?.id || 'nenhuma');
        
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro na verificação inicial:', error);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id || 'sem usuário');
      
      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUserProfile(session.user.id);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    getInitialSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
        // Se perfil não existe, criar um básico
        if (error.code === 'PGRST116') {
          console.log('Perfil não encontrado, será criado automaticamente');
        }
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
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no login:', error);
      throw error;
    }
    
    console.log('Login bem-sucedido:', data.user?.id);
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro no logout:', error);
      throw error;
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
