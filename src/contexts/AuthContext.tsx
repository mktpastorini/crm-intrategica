
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
    console.log('AuthProvider: Configurando autenticação');
    
    // Configurar listener de mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        
        // Carregar perfil do usuário
        const userProfile = await loadUserProfile(session.user.id);
        setProfile(userProfile);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    // Verificar sessão atual uma única vez
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setLoading(false);
          return;
        }

        // Não definir estado aqui, deixar o onAuthStateChange lidar com isso
        if (!session) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
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
