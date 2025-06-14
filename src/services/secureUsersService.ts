
import { supabase } from '@/integrations/supabase/client';
import { securityHelpers } from '@/utils/securityHelpers';
import { inputValidation } from '@/utils/inputValidation';

export interface CreateUserData {
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'comercial';
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'supervisor' | 'comercial';
  status?: 'active' | 'inactive';
}

export const secureUsersService = {
  async getAll() {
    // Verificar se o usuário tem permissão de administrador
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem visualizar usuários');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(userData: CreateUserData) {
    console.log('Iniciando criação de usuário:', userData.email);
    
    // Verificar se o usuário atual é admin
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem criar usuários');
    }

    // Validate input data
    if (!inputValidation.validateRequired(userData.name)) {
      throw new Error('Nome é obrigatório');
    }

    if (!inputValidation.validateEmail(userData.email)) {
      throw new Error('Email inválido');
    }

    if (!inputValidation.validateLength(userData.password, 6, 100)) {
      throw new Error('Senha deve ter entre 6 e 100 caracteres');
    }

    // Sanitize input
    const sanitizedData = {
      ...userData,
      name: inputValidation.sanitizeHtml(userData.name),
      email: userData.email.toLowerCase().trim()
    };

    console.log('Dados sanitizados:', sanitizedData);

    try {
      // Usar service_role key para criar usuário
      const { data: authData, error: authError } = await supabase.rpc('create_user_with_profile', {
        user_email: sanitizedData.email,
        user_password: sanitizedData.password,
        user_name: sanitizedData.name,
        user_role: sanitizedData.role
      });

      if (authError) {
        console.error('Erro na function create_user_with_profile:', authError);
        throw new Error(authError.message || 'Erro ao criar usuário no sistema de autenticação');
      }

      console.log('Usuário criado com sucesso:', authData);
      return authData;

    } catch (error: any) {
      console.error('Erro detalhado na criação:', error);
      
      // Tentar método alternativo se a function não existir
      if (error.message?.includes('function') || error.message?.includes('does not exist')) {
        console.log('Tentando método alternativo...');
        
        // Criar perfil diretamente na tabela profiles
        const userId = crypto.randomUUID();
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            name: sanitizedData.name,
            email: sanitizedData.email,
            role: sanitizedData.role,
            status: 'active'
          })
          .select()
          .single();

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
          throw new Error('Erro ao criar perfil do usuário');
        }

        return newProfile;
      }
      
      throw error;
    }
  },

  async update(id: string, updates: UpdateUserData) {
    // Verificar se o usuário atual é admin
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem atualizar usuários');
    }

    // Validate and sanitize updates
    const sanitizedUpdates: UpdateUserData = {};
    
    if (updates.name !== undefined) {
      if (!inputValidation.validateRequired(updates.name)) {
        throw new Error('Nome é obrigatório');
      }
      sanitizedUpdates.name = inputValidation.sanitizeHtml(updates.name);
    }

    if (updates.email !== undefined) {
      if (!inputValidation.validateEmail(updates.email)) {
        throw new Error('Email inválido');
      }
      sanitizedUpdates.email = updates.email.toLowerCase().trim();
    }

    if (updates.role !== undefined) {
      sanitizedUpdates.role = updates.role;
    }

    if (updates.status !== undefined) {
      sanitizedUpdates.status = updates.status;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    // Verificar se o usuário atual é admin
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem excluir usuários');
    }

    // Prevent users from deleting themselves
    if (currentUser.user.id === id) {
      throw new Error('Você não pode excluir sua própria conta');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  },

  async toggleStatus(id: string) {
    // Verificar se o usuário atual é admin
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) {
      throw new Error('Usuário não autenticado');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new Error('Acesso negado: apenas administradores podem alterar status de usuários');
    }

    // Get current status
    const { data: currentUserData, error: fetchError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const newStatus = currentUserData.status === 'active' ? 'inactive' : 'active';
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
