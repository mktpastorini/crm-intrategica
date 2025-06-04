
import { supabase } from '@/integrations/supabase/client';

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

export const usersService = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(userData: CreateUserData) {
    // Primeiro criar o usuário no auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role
      }
    });

    if (authError) throw authError;

    // O perfil será criado automaticamente via trigger
    // Vamos aguardar um pouco e buscar o perfil criado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      // Se não encontrou o perfil, criar manualmente
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: 'active'
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }

    return profile;
  },

  async update(id: string, updates: UpdateUserData) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    // Deletar o usuário do auth (isso também deletará o perfil via CASCADE)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;
    
    return true;
  },

  async toggleStatus(id: string) {
    // Primeiro buscar o status atual
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
