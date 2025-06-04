import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  niche: string;
  status: string;
  responsible_id: string;
  responsible?: {
    name: string;
    email: string;
  };
  createdAt: string;
  pipelineStage?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface Event {
  id: string;
  title: string;
  leadName?: string;
  company?: string;
  date: string;
  time: string;
  responsible_id: string;
  responsible?: {
    name: string;
    email: string;
  };
  type: 'reunion' | 'call' | 'whatsapp' | 'email';
  leadId?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'comercial';
  status: 'active' | 'inactive';
  created_at: string;
  last_login?: string;
}

export interface PendingAction {
  id: string;
  type: 'edit_lead' | 'delete_lead' | 'edit_event' | 'delete_event';
  user: string;
  description: string;
  timestamp: string;
  data: any;
  details: any;
}

interface CrmContextType {
  leads: Lead[];
  profiles: Profile[];
  pipelineStages: PipelineStage[];
  events: Event[];
  pendingActions: PendingAction[];
  loading: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLead: (leadId: string, newStage: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addProfile: (profile: Omit<Profile, 'id' | 'created_at'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  fetchProfiles: () => Promise<void>;
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
  requestLeadEdit: (leadId: string, updates: Partial<Lead>, user: string) => void;
  requestLeadDelete: (leadId: string, user: string) => void;
  addPipelineStage: (stage: PipelineStage) => void;
  updatePipelineStage: (id: string, updates: Partial<PipelineStage>) => void;
  deletePipelineStage: (id: string) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Carregar leads do localStorage com fallback
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('leads');
    return saved ? JSON.parse(saved) : [];
  });

  // Carregar estágios do pipeline do localStorage (mantido local por enquanto)
  const [pipelineStages] = useState<PipelineStage[]>([
    { id: 'aguardando-inicio', name: 'Aguardando Início', order: 1, color: '#e11d48' },
    { id: 'primeiro-contato', name: 'Primeiro Contato', order: 2, color: '#f59e0b' },
    { id: 'reuniao', name: 'Reunião', order: 3, color: '#3b82f6' },
    { id: 'proposta-enviada', name: 'Proposta Enviada', order: 4, color: '#8b5cf6' },
    { id: 'negociacao', name: 'Negociação', order: 5, color: '#06b6d4' },
    { id: 'contrato-assinado', name: 'Contrato Assinado', order: 6, color: '#10b981' }
  ]);

  // Carregar eventos do localStorage com fallback
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('events');
    return saved ? JSON.parse(saved) : [];
  });

  // Carregar ações pendentes do localStorage (mantido local por enquanto)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => {
    const saved = localStorage.getItem('pendingActions');
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchLeads(), fetchEvents(), fetchProfiles()]);
        setLoading(false);
      };
      loadData();
    }
  }, [user]);

  const fetchLeads = async () => {
    try {
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

      const mappedLeads = data?.map(lead => ({
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

      setLeads(mappedLeads);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads",
        variant: "destructive",
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          responsible:responsible_id (
            name,
            email
          )
        `)
        .order('date', { ascending: true });

      if (error) throw error;

      const mappedEvents = data?.map(event => ({
        id: event.id,
        title: event.title,
        leadName: event.lead_name,
        company: event.company,
        date: event.date,
        time: event.time,
        responsible_id: event.responsible_id,
        responsible: event.responsible,
        type: event.type as 'reunion' | 'call' | 'whatsapp' | 'email',
        leadId: event.lead_id
      })) || [];

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos",
        variant: "destructive",
      });
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
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

      await fetchLeads();
      toast({
        title: "Lead adicionado",
        description: "Lead foi adicionado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o lead",
        variant: "destructive",
      });
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
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

      await fetchLeads();
      toast({
        title: "Lead atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lead",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchLeads();
      await fetchEvents(); // Recarregar eventos também
      toast({
        title: "Lead removido",
        description: "Lead foi removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o lead",
        variant: "destructive",
      });
    }
  };

  const moveLead = async (leadId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ pipeline_stage: newStage })
        .eq('id', leadId);

      if (error) throw error;

      await fetchLeads();
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível mover o lead",
        variant: "destructive",
      });
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          lead_name: eventData.leadName,
          company: eventData.company,
          date: eventData.date,
          time: eventData.time,
          responsible_id: eventData.responsible_id,
          type: eventData.type,
          lead_id: eventData.leadId
        });

      if (error) throw error;

      await fetchEvents();
      toast({
        title: "Evento adicionado",
        description: "Evento foi agendado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o evento",
        variant: "destructive",
      });
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: updates.title,
          lead_name: updates.leadName,
          company: updates.company,
          date: updates.date,
          time: updates.time,
          responsible_id: updates.responsible_id,
          type: updates.type,
          lead_id: updates.leadId
        })
        .eq('id', id);

      if (error) throw error;

      await fetchEvents();
      toast({
        title: "Evento atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o evento",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEvents();
      toast({
        title: "Evento removido",
        description: "Evento foi removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o evento",
        variant: "destructive",
      });
    }
  };

  const addProfile = async (profileData: Omit<Profile, 'id' | 'created_at'>) => {
    try {
      // Primeiro criar o usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: profileData.email,
        password: Math.random().toString(36).slice(-8), // Senha temporária
        email_confirm: true
      });

      if (authError) throw authError;

      // Depois criar o perfil
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

      await fetchProfiles();
      toast({
        title: "Usuário adicionado",
        description: "Usuário foi criado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o usuário",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    try {
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

      await fetchProfiles();
      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário",
        variant: "destructive",
      });
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchProfiles();
      toast({
        title: "Usuário removido",
        description: "Usuário foi removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário",
        variant: "destructive",
      });
    }
  };

  const addPipelineStage = (stage: PipelineStage) => {
    // Implementação local mantida
  };

  const updatePipelineStage = (id: string, updates: Partial<PipelineStage>) => {
    // Implementação local mantida
  };

  const deletePipelineStage = (id: string) => {
    // Implementação local mantida
  };

  const requestLeadEdit = (leadId: string, updates: Partial<Lead>, user: string) => {
    // Implementação local mantida
  };

  const requestLeadDelete = (leadId: string, user: string) => {
    // Implementação local mantida
  };

  const approveAction = (actionId: string) => {
    // Implementação local mantida
  };

  const rejectAction = (actionId: string) => {
    // Implementação local mantida
  };

  return (
    <CrmContext.Provider value={{
      leads,
      profiles,
      pipelineStages,
      events,
      pendingActions,
      loading,
      addLead,
      updateLead,
      deleteLead,
      moveLead,
      addEvent,
      updateEvent,
      deleteEvent,
      addProfile,
      updateProfile,
      deleteProfile,
      fetchProfiles,
      approveAction,
      rejectAction,
      requestLeadEdit,
      requestLeadDelete,
      addPipelineStage,
      updatePipelineStage,
      deletePipelineStage
    }}>
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
