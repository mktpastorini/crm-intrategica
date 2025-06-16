
import { supabase } from '@/integrations/supabase/client';
import { Proposal, ProductService } from '@/types/proposal';

export const proposalService = {
  async getAll(): Promise<Proposal[]> {
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .insert(proposal)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Proposal>): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async linkToLead(proposalId: string, leadId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ proposal_id: proposalId })
      .eq('id', leadId);
    
    if (error) throw error;
  }
};

export const productServiceService = {
  async getAll(): Promise<ProductService[]> {
    const { data, error } = await supabase
      .from('products_services')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    // Type cast the data to ensure proper typing
    return (data || []).map(item => ({
      ...item,
      type: item.type as 'product' | 'service'
    }));
  },

  async create(item: Omit<ProductService, 'id' | 'created_at' | 'updated_at'>): Promise<ProductService> {
    const { data, error } = await supabase
      .from('products_services')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    // Type cast the data to ensure proper typing
    return {
      ...data,
      type: data.type as 'product' | 'service'
    };
  },

  async update(id: string, updates: Partial<ProductService>): Promise<ProductService> {
    const { data, error } = await supabase
      .from('products_services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    // Type cast the data to ensure proper typing
    return {
      ...data,
      type: data.type as 'product' | 'service'
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products_services')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
