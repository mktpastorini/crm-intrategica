
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

  useEffect(() => {
    console.log('AuthProvider: Iniciando configuração de autenticação');
    
    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state change:', event, newSession?.user?.id);
      
      setSession(newSession);
      
      if (newSession?.user) {
        console.log('Usuário encontrado, buscando perfil...');
        
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
          
          if (error) {
            console.error('Erro ao buscar perfil:', error);
            setUser(null);
          } else if (profile) {
            console.log('Perfil encontrado:', profile);
            setUser(profile as UserProfile);
          } else {
            console.log('Perfil não encontrado');
            setUser(null);
          }
        } catch (error) {
          console.error('Erro na busca do perfil:', error);
          setUser(null);
        }
      } else {
        console.log('Nenhum usuário logado');
        setUser(null);
      }
      
      setLoading(false);
    });

    // Verificar sessão atual
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          setLoading(false);
          return;
        }

        console.log('Sessão inicial:', currentSession?.user?.id || 'Nenhuma');
        
        // Se não há sessão, definir loading como false
        if (!currentSession) {
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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Tentando fazer login com:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro de login:', error);
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        console.log('Login bem-sucedido');
        
        // Atualizar último login (não crítico se falhar)
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

      return { success: false, error: 'Dados de usuário inválidos' };
    } catch (error) {
      console.error('Erro durante login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  };

  const logout = async () => {
    try {
      console.log('Fazendo logout...');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
