
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/crm';

export const fetchLeads = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      responsible:responsible_id (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data?.map(lead => ({
    id: lead.id,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    email: lead.email,
    niche: lead.niche,
    status: lead.status,
    responsible_id: lead.responsible_id,
    responsible: lead.responsible,
    createdAt: lead.created_at,
    pipelineStage: lead.pipeline_stage
  })) || [];
};

export const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
  const { data, error } = await supabase
    .from('leads')
    .insert({
      name: leadData.name,
      company: leadData.company,
      phone: leadData.phone,
      email: leadData.email,
      niche: leadData.niche,
      status: leadData.status,
      responsible_id: leadData.responsible_id,
      pipeline_stage: leadData.pipelineStage || 'aguardando-inicio'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateLead = async (id: string, updates: Partial<Lead>) => {
  const { error } = await supabase
    .from('leads')
    .update({
      name: updates.name,
      company: updates.company,
      phone: updates.phone,
      email: updates.email,
      niche: updates.niche,
      status: updates.status,
      responsible_id: updates.responsible_id,
      pipeline_stage: updates.pipelineStage,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteLead = async (id: string) => {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const moveLead = async (leadId: string, newStage: string) => {
  const { error } = await supabase
    .from('leads')
    .update({ pipeline_stage: newStage })
    .eq('id', leadId);

  if (error) throw error;
};
