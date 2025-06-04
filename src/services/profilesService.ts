
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/crm';

export const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data?.map(profile => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as 'admin' | 'supervisor' | 'comercial',
    status: profile.status as 'active' | 'inactive',
    created_at: profile.created_at,
    last_login: profile.last_login
  })) || [];
};

export const addProfile = async (profileData: Omit<Profile, 'id' | 'created_at'>) => {
  // First create the user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: profileData.email,
    password: Math.random().toString(36).slice(-8), // Temporary password
    email_confirm: true
  });

  if (authError) throw authError;

  // Then create the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      name: profileData.name,
      email: profileData.email,
      role: profileData.role,
      status: profileData.status
    });

  if (profileError) throw profileError;
};

export const updateProfile = async (id: string, updates: Partial<Profile>) => {
  const { error } = await supabase
    .from('profiles')
    .update({
      name: updates.name,
      email: updates.email,
      role: updates.role,
      status: updates.status
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteProfile = async (id: string) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
