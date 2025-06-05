
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

  // Limpar cache do localStorage na inicialização
  useEffect(() => {
    const clearCache = () => {
      try {
        // Limpar dados antigos que podem estar causando problemas
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('user-session');
        console.log('Cache limpo com sucesso');
      } catch (error) {
        console.warn('Erro ao limpar cache:', error);
      }
    };

    clearCache();
  }, []);

  useEffect(() => {
    console.log('AuthProvider: Iniciando configuração de autenticação');
    
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change:', event, newSession?.user?.id);
      
      if (!mounted) return;

      setSession(newSession);
      
      if (newSession?.user && event !== 'SIGNED_OUT') {
        console.log('Usuário encontrado, buscando perfil...');
        
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
          
          if (error) {
            console.error('Erro ao buscar perfil:', error);
            if (mounted) setUser(null);
          } else if (profile && mounted) {
            console.log('Perfil encontrado:', profile);
            setUser(profile as UserProfile);
          } else if (mounted) {
            console.log('Perfil não encontrado');
            setUser(null);
          }
        } catch (error) {
          console.error('Erro na busca do perfil:', error);
          if (mounted) setUser(null);
        }
      } else {
        console.log('Nenhum usuário logado');
        if (mounted) setUser(null);
      }
      
      if (mounted) setLoading(false);
    });

    // Verificar sessão atual apenas uma vez
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (mounted) setLoading(false);
          return;
        }

        console.log('Sessão inicial:', currentSession?.user?.id || 'Nenhuma');
        
        if (!currentSession && mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro na inicialização:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Tentando fazer login com:', email);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Erro de login:', error);
        setLoading(false);
        return { success: false, error: 'Email ou senha incorretos' };
      }

      if (data.user && data.session) {
        console.log('Login bem-sucedido');
        
        try {
          await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        } catch (updateError) {
          console.warn('Erro ao atualizar último login:', updateError);
        }

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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      
      // Limpar qualquer cache restante
      localStorage.removeItem('leads');
      localStorage.removeItem('events');
      localStorage.removeItem('pipelineStages');
      localStorage.removeItem('pendingActions');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const isAuthenticated = !!user && !!session && user.status === 'active';

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
