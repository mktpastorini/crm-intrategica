
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile> & { password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Carregando perfil do usuário:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return;
      }

      console.log('Perfil carregado:', data);
      setProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<Profile> & { password?: string }) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Update password if provided
      if (updates.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: updates.password
        });
        if (passwordError) throw passwordError;
      }

      // Update profile data (excluding password)
      const profileUpdates = { ...updates };
      delete profileUpdates.password;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);

        if (profileError) throw profileError;

        // Update local state
        setProfile(prev => prev ? { ...prev, ...profileUpdates } : null);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login...');
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }

      console.log('Login realizado com sucesso:', data.user?.id);
      setUser(data.user);
      
      // Aguardar um pouco e carregar o perfil
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Fazendo logout...');
      setLoading(true);
      
      // Limpar cache do localStorage para evitar loops
      localStorage.removeItem('sb-gfuoipqwmhfrqhmkqyxp-auth-token');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error);
      }
      
      setUser(null);
      setProfile(null);
      
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verificar sessão inicial
    const checkSession = async () => {
      try {
        console.log('Verificando sessão inicial...');
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Sessão encontrada:', session.user.id);
          setUser(session.user);
        } else {
          console.log('Nenhuma sessão encontrada');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Mudança de autenticação:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Carregar perfil quando user muda
  useEffect(() => {
    if (user && !profile) {
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
    updateProfile
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
