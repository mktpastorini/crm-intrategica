
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company: string;
  niche: string;
  status: string;
  pipeline_stage?: string;
  responsible_id: string;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  company?: string;
  lead_id?: string;
  lead_name?: string;
  responsible_id: string;
  created_at: string;
}

interface CrmContextType {
  leads: Lead[];
  events: Event[];
  loading: boolean;
  actionLoading: string | null;
  
  // Leads
  loadLeads: () => Promise<void>;
  createLead: (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLead: (id: string, leadData: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  
  // Events
  loadEvents: () => Promise<void>;
  createEvent: (eventData: Omit<Event, 'id' | 'created_at'>) => Promise<void>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Load Leads
  const loadLeads = useCallback(async () => {
    try {
      console.log('Carregando leads...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar leads:', error);
        throw error;
      }

      console.log('Leads carregados:', data?.length || 0);
      setLeads(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar leads:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create Lead
  const createLead = useCallback(async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Criando lead:', leadData);
      setActionLoading('create-lead');
      
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar lead:', error);
        throw error;
      }

      console.log('Lead criado:', data);
      setLeads(prev => [data, ...prev]);
      
      toast({
        title: "Lead criado",
        description: "Lead foi criado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar lead",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Update Lead
  const updateLead = useCallback(async (id: string, leadData: Partial<Lead>) => {
    try {
      console.log('Atualizando lead:', id, leadData);
      setActionLoading(id);
      
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar lead:', error);
        throw error;
      }

      console.log('Lead atualizado:', data);
      setLeads(prev => prev.map(lead => lead.id === id ? data : lead));
      
      toast({
        title: "Lead atualizado",
        description: "Lead foi atualizado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar lead",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Delete Lead
  const deleteLead = useCallback(async (id: string) => {
    try {
      console.log('Deletando lead:', id);
      setActionLoading(id);
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar lead:', error);
        throw error;
      }

      console.log('Lead deletado:', id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
      
      toast({
        title: "Lead excluído",
        description: "Lead foi excluído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao deletar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir lead",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Load Events
  const loadEvents = useCallback(async () => {
    try {
      console.log('Carregando eventos...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Erro ao carregar eventos:', error);
        throw error;
      }

      console.log('Eventos carregados:', data?.length || 0);
      setEvents(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create Event
  const createEvent = useCallback(async (eventData: Omit<Event, 'id' | 'created_at'>) => {
    try {
      console.log('Criando evento:', eventData);
      setActionLoading('create-event');
      
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar evento:', error);
        throw error;
      }

      console.log('Evento criado:', data);
      setEvents(prev => [...prev, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      
      toast({
        title: "Evento criado",
        description: "Evento foi criado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar evento",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Update Event
  const updateEvent = useCallback(async (id: string, eventData: Partial<Event>) => {
    try {
      console.log('Atualizando evento:', id, eventData);
      setActionLoading(id);
      
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar evento:', error);
        throw error;
      }

      console.log('Evento atualizado:', data);
      setEvents(prev => prev.map(event => event.id === id ? data : event)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      
      toast({
        title: "Evento atualizado",
        description: "Evento foi atualizado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar evento",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Delete Event
  const deleteEvent = useCallback(async (id: string) => {
    try {
      console.log('Deletando evento:', id);
      setActionLoading(id);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar evento:', error);
        throw error;
      }

      console.log('Evento deletado:', id);
      setEvents(prev => prev.filter(event => event.id !== id));
      
      toast({
        title: "Evento excluído",
        description: "Evento foi excluído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir evento",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Load initial data
  useEffect(() => {
    loadLeads();
    loadEvents();
  }, [loadLeads, loadEvents]);

  const value: CrmContextType = {
    leads,
    events,
    loading,
    actionLoading,
    loadLeads,
    createLead,
    updateLead,
    deleteLead,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };

  return (
    <CrmContext.Provider value={value}>
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (context === undefined) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
}
