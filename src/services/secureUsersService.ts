
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
    // Check if user has permission to view all users
    const canAccess = await securityHelpers.hasRole(['admin', 'supervisor']);
    if (!canAccess) {
      throw new Error('Acesso negado: você não tem permissão para visualizar usuários');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(userData: CreateUserData) {
    // Check if user has permission to create users
    const canAccess = await securityHelpers.hasRole(['admin']);
    if (!canAccess) {
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

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: sanitizedData.email,
      password: sanitizedData.password,
      email_confirm: true,
      user_metadata: {
        name: sanitizedData.name,
        role: sanitizedData.role
      }
    });

    if (authError) throw authError;

    // Wait for profile to be created by trigger
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      // Create profile manually if trigger failed
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: sanitizedData.name,
          email: sanitizedData.email,
          role: sanitizedData.role,
          status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }

    // Update profile with correct data
    if (profile.name !== sanitizedData.name || profile.role !== sanitizedData.role) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: sanitizedData.name,
          role: sanitizedData.role
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedProfile;
    }

    return profile;
  },

  async update(id: string, updates: UpdateUserData) {
    // Check if user can update this profile
    const canAccess = await securityHelpers.canAccessResource(id, ['admin']);
    if (!canAccess) {
      throw new Error('Acesso negado: você não tem permissão para atualizar este usuário');
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
    // Check if user has permission to delete users
    const canAccess = await securityHelpers.hasRole(['admin']);
    if (!canAccess) {
      throw new Error('Acesso negado: apenas administradores podem excluir usuários');
    }

    // Prevent users from deleting themselves
    const currentProfile = await securityHelpers.getCurrentUserProfile();
    if (currentProfile?.id === id) {
      throw new Error('Você não pode excluir sua própria conta');
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;
    
    return true;
  },

  async toggleStatus(id: string) {
    // Check if user can update this profile
    const canAccess = await securityHelpers.canAccessResource(id, ['admin']);
    if (!canAccess) {
      throw new Error('Acesso negado: você não tem permissão para alterar o status deste usuário');
    }

    // Get current status
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;
    
    const newStatus = currentUser.status === 'active' ? 'inactive' : 'active';
    
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
