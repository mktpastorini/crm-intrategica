
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Limpar cache antigo na inicialização
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    console.log('AuthProvider: Iniciando configuração de autenticação');
    
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Sessão atual:', session);
      if (session?.user) {
        setUser(session.user);
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('Usuário encontrado, buscando perfil...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        setProfile(null);
      } else {
        console.log('Perfil carregado:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

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

  const isAuthenticated = !!user;

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    signIn,
    signOut,
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
