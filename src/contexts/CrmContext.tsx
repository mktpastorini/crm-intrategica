
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface PendingAction {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  details?: any;
}

interface CrmContextType {
  leads: Lead[];
  events: Event[];
  users: User[];
  pipelineStages: PipelineStage[];
  pendingActions: PendingAction[];
  loading: boolean;
  actionLoading: string | null;
  
  // Leads
  loadLeads: () => Promise<void>;
  createLead: (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLead: (id: string, leadData: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLead: (leadId: string, newStage: string) => Promise<void>;
  
  // Events
  loadEvents: () => Promise<void>;
  createEvent: (eventData: Omit<Event, 'id' | 'created_at'>) => Promise<void>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addEvent: (eventData: Omit<Event, 'id' | 'created_at'>) => Promise<void>;
  
  // Users
  loadUsers: () => Promise<void>;
  createUser: (userData: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Pipeline Stages
  addPipelineStage: (stage: Omit<PipelineStage, 'id'>) => void;
  updatePipelineStage: (id: string, stage: Partial<PipelineStage>) => void;
  deletePipelineStage: (id: string) => void;
  
  // Supervision
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

// Default pipeline stages
const defaultPipelineStages: PipelineStage[] = [
  { id: 'novo', name: 'Novo', color: '#3b82f6', order: 1 },
  { id: 'contato-inicial', name: 'Contato Inicial', color: '#f59e0b', order: 2 },
  { id: 'qualificacao', name: 'Qualificação', color: '#8b5cf6', order: 3 },
  { id: 'reuniao', name: 'Reunião', color: '#06b6d4', order: 4 },
  { id: 'proposta-enviada', name: 'Proposta Enviada', color: '#ef4444', order: 5 },
  { id: 'contrato-assinado', name: 'Contrato Assinado', color: '#10b981', order: 6 }
];

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(defaultPipelineStages);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
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

  // Move Lead
  const moveLead = useCallback(async (leadId: string, newStage: string) => {
    try {
      await updateLead(leadId, { pipeline_stage: newStage });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
    }
  }, [updateLead]);

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

  // Add Event (alias for createEvent)
  const addEvent = createEvent;

  // Load Users
  const loadUsers = useCallback(async () => {
    try {
      console.log('Carregando usuários...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        throw error;
      }

      console.log('Usuários carregados:', data?.length || 0);
      setUsers(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create User
  const createUser = useCallback(async (userData: Omit<User, 'id'>) => {
    try {
      console.log('Criando usuário:', userData);
      setActionLoading('create-user');
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar usuário:', error);
        throw error;
      }

      console.log('Usuário criado:', data);
      setUsers(prev => [...prev, data]);
      
      toast({
        title: "Usuário criado",
        description: "Usuário foi criado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar usuário",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Update User
  const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
    try {
      console.log('Atualizando usuário:', id, userData);
      setActionLoading(id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar usuário:', error);
        throw error;
      }

      console.log('Usuário atualizado:', data);
      setUsers(prev => prev.map(user => user.id === id ? data : user));
      
      toast({
        title: "Usuário atualizado",
        description: "Usuário foi atualizado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Delete User
  const deleteUser = useCallback(async (id: string) => {
    try {
      console.log('Deletando usuário:', id);
      setActionLoading(id);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar usuário:', error);
        throw error;
      }

      console.log('Usuário deletado:', id);
      setUsers(prev => prev.filter(user => user.id !== id));
      
      toast({
        title: "Usuário excluído",
        description: "Usuário foi excluído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  }, [toast]);

  // Pipeline Stages Management
  const addPipelineStage = useCallback((stage: Omit<PipelineStage, 'id'>) => {
    const newStage: PipelineStage = {
      ...stage,
      id: `stage-${Date.now()}`
    };
    setPipelineStages(prev => [...prev, newStage]);
    toast({
      title: "Estágio adicionado",
      description: "Estágio foi adicionado com sucesso",
    });
  }, [toast]);

  const updatePipelineStage = useCallback((id: string, stage: Partial<PipelineStage>) => {
    setPipelineStages(prev => prev.map(s => s.id === id ? { ...s, ...stage } : s));
    toast({
      title: "Estágio atualizado",
      description: "Estágio foi atualizado com sucesso",
    });
  }, [toast]);

  const deletePipelineStage = useCallback((id: string) => {
    setPipelineStages(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Estágio removido",
      description: "Estágio foi removido com sucesso",
    });
  }, [toast]);

  // Supervision Actions
  const approveAction = useCallback((actionId: string) => {
    setPendingActions(prev => prev.filter(action => action.id !== actionId));
    toast({
      title: "Ação aprovada",
      description: "A ação foi aprovada com sucesso",
    });
  }, [toast]);

  const rejectAction = useCallback((actionId: string) => {
    setPendingActions(prev => prev.filter(action => action.id !== actionId));
    toast({
      title: "Ação rejeitada",
      description: "A ação foi rejeitada",
    });
  }, [toast]);

  // Load initial data
  useEffect(() => {
    loadLeads();
    loadEvents();
    loadUsers();
  }, [loadLeads, loadEvents, loadUsers]);

  const value: CrmContextType = {
    leads,
    events,
    users,
    pipelineStages,
    pendingActions,
    loading,
    actionLoading,
    loadLeads,
    createLead,
    updateLead,
    deleteLead,
    moveLead,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    addEvent,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    addPipelineStage,
    updatePipelineStage,
    deletePipelineStage,
    approveAction,
    rejectAction,
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
