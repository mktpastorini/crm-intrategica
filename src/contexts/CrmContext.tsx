import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  niche: string;
  status: string;
  responsible: string;
  createdAt: string;
  pipelineStage?: string;
  responsible_id: string;
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
  responsible: string;
  type: 'reunion' | 'call' | 'whatsapp' | 'email';
  leadId?: string;
  responsible_id: string;
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

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'comercial';
}

interface CrmContextType {
  leads: Lead[];
  pipelineStages: PipelineStage[];
  events: Event[];
  pendingActions: PendingAction[];
  users: UserProfile[];
  loading: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLead: (leadId: string, newStage: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
  requestLeadEdit: (leadId: string, updates: Partial<Lead>, user: string) => void;
  requestLeadDelete: (leadId: string, user: string) => void;
  addPipelineStage: (stage: PipelineStage) => void;
  updatePipelineStage: (id: string, updates: Partial<PipelineStage>) => void;
  deletePipelineStage: (id: string) => void;
  fetchUsers: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Dados locais que ainda não foram migrados para Supabase
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(() => {
    const saved = localStorage.getItem('pipelineStages');
    return saved ? JSON.parse(saved) : [
      { id: 'aguardando-inicio', name: 'Aguardando Início', order: 1, color: '#e11d48' },
      { id: 'primeiro-contato', name: 'Primeiro Contato', order: 2, color: '#f59e0b' },
      { id: 'reuniao', name: 'Reunião', order: 3, color: '#3b82f6' },
      { id: 'proposta-enviada', name: 'Proposta Enviada', order: 4, color: '#8b5cf6' },
      { id: 'negociacao', name: 'Negociação', order: 5, color: '#06b6d4' },
      { id: 'contrato-assinado', name: 'Contrato Assinado', order: 6, color: '#10b981' }
    ];
  });

  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => {
    const saved = localStorage.getItem('pendingActions');
    return saved ? JSON.parse(saved) : [];
  });

  // Carregar dados apenas quando usuário estiver autenticado e auth não estiver carregando
  useEffect(() => {
    if (!authLoading && user && !dataLoaded) {
      console.log('Usuário disponível, carregando dados do CRM...');
      refreshData();
      setDataLoaded(true);
    } else if (!user) {
      // Limpar dados quando usuário não estiver autenticado
      console.log('Usuário não autenticado, limpando dados...');
      setLeads([]);
      setEvents([]);
      setUsers([]);
      setDataLoaded(false);
    }
  }, [user, authLoading, dataLoaded]);

  const fetchLeads = async () => {
    if (!user) return;
    
    try {
      console.log('Buscando leads...');
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          profiles:responsible_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar leads:', error);
        return;
      }

      const formattedLeads = data?.map(lead => ({
        id: lead.id,
        name: lead.name,
        company: lead.company,
        phone: lead.phone,
        email: lead.email,
        niche: lead.niche,
        status: lead.status,
        responsible: lead.profiles?.name || 'Não atribuído',
        responsible_id: lead.responsible_id,
        createdAt: lead.created_at,
        pipelineStage: lead.pipeline_stage || 'aguardando-inicio'
      })) || [];

      setLeads(formattedLeads);
      console.log('Leads carregados:', formattedLeads.length);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  };

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      console.log('Buscando eventos...');
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:responsible_id (name)
        `)
        .order('date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar eventos:', error);
        return;
      }

      const formattedEvents = data?.map(event => ({
        id: event.id,
        title: event.title,
        leadName: event.lead_name,
        company: event.company,
        date: event.date,
        time: event.time,
        responsible: event.profiles?.name || 'Não atribuído',
        responsible_id: event.responsible_id,
        type: event.type as 'reunion' | 'call' | 'whatsapp' | 'email',
        leadId: event.lead_id
      })) || [];

      setEvents(formattedEvents);
      console.log('Eventos carregados:', formattedEvents.length);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  };

  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      console.log('Buscando usuários...');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('status', 'active')
        .order('name');
      
      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return;
      }
      
      const typedUsers = (data || []).map(user => ({
        ...user,
        role: user.role as 'admin' | 'supervisor' | 'comercial'
      }));
      
      setUsers(typedUsers);
      console.log('Usuários carregados:', typedUsers.length);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const refreshData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('Atualizando todos os dados...');
      await Promise.all([
        fetchLeads(),
        fetchEvents(),
        fetchUsers()
      ]);
      console.log('Dados atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar dados locais no localStorage
  const savePipelineStages = (newStages: PipelineStage[]) => {
    setPipelineStages(newStages);
    localStorage.setItem('pipelineStages', JSON.stringify(newStages));
  };

  const savePendingActions = (newActions: PendingAction[]) => {
    setPendingActions(newActions);
    localStorage.setItem('pendingActions', JSON.stringify(newActions));
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      console.log('Adicionando lead:', leadData);
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
    } catch (error: any) {
      console.error('Erro ao adicionar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar lead",
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
          pipeline_stage: updates.pipelineStage
        })
        .eq('id', id);

      if (error) throw error;

      await fetchLeads();
      
      toast({
        title: "Lead atualizado",
        description: "As alterações foram salvas",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar lead",
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

      await Promise.all([fetchLeads(), fetchEvents()]);
      
      toast({
        title: "Lead removido",
        description: "Lead foi removido com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao deletar lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover lead",
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
    } catch (error: any) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao mover lead",
        variant: "destructive",
      });
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      const { data, error } = await supabase
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
        })
        .select()
        .single();

      if (error) throw error;

      await fetchEvents();
      
      toast({
        title: "Evento adicionado",
        description: "Evento foi agendado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao adicionar evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar evento",
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
        description: "As alterações foram salvas",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar evento",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      console.log('Deletando evento:', id);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar evento:', error);
        throw error;
      }

      console.log('Evento deletado, atualizando lista...');
      await fetchEvents();
      
      toast({
        title: "Evento removido",
        description: "Evento foi removido com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao deletar evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover evento",
        variant: "destructive",
      });
    }
  };

  const addPipelineStage = (stage: PipelineStage) => {
    const newStages = [...pipelineStages, stage];
    savePipelineStages(newStages);
    toast({
      title: "Estágio adicionado",
      description: "Novo estágio foi adicionado ao pipeline",
    });
  };

  const updatePipelineStage = (id: string, updates: Partial<PipelineStage>) => {
    const newStages = pipelineStages.map(stage => 
      stage.id === id ? { ...stage, ...updates } : stage
    );
    savePipelineStages(newStages);
    toast({
      title: "Estágio atualizado",
      description: "Estágio foi atualizado com sucesso",
    });
  };

  const deletePipelineStage = (id: string) => {
    const newStages = pipelineStages.filter(stage => stage.id !== id);
    savePipelineStages(newStages);
    toast({
      title: "Estágio removido",
      description: "Estágio foi removido do pipeline",
    });
  };

  const requestLeadEdit = (leadId: string, updates: Partial<Lead>, user: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const action: PendingAction = {
      id: Date.now().toString(),
      type: 'edit_lead',
      user,
      description: `Solicitou edição do lead "${lead.name}"`,
      timestamp: new Date().toLocaleString('pt-BR'),
      data: { leadId, updates },
      details: {
        leadName: lead.name,
        changes: updates
      }
    };

    const newActions = [...pendingActions, action];
    savePendingActions(newActions);
    toast({
      title: "Solicitação enviada",
      description: "Sua solicitação de edição foi enviada para aprovação",
    });
  };

  const requestLeadDelete = (leadId: string, user: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const action: PendingAction = {
      id: Date.now().toString(),
      type: 'delete_lead',
      user,
      description: `Solicitou exclusão do lead "${lead.name}"`,
      timestamp: new Date().toLocaleString('pt-BR'),
      data: { leadId },
      details: {
        leadName: lead.name
      }
    };

    const newActions = [...pendingActions, action];
    savePendingActions(newActions);
    toast({
      title: "Solicitação enviada",
      description: "Sua solicitação de exclusão foi enviada para aprovação",
    });
  };

  const approveAction = async (actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;

    // Execute a ação
    switch (action.type) {
      case 'edit_lead':
        await updateLead(action.data.leadId, action.data.updates);
        break;
      case 'delete_lead':
        await deleteLead(action.data.leadId);
        break;
      case 'edit_event':
        await updateEvent(action.data.eventId, action.data.updates);
        break;
      case 'delete_event':
        await deleteEvent(action.data.eventId);
        break;
    }

    // Remove da lista de ações pendentes
    const newActions = pendingActions.filter(a => a.id !== actionId);
    savePendingActions(newActions);
    
    toast({
      title: "Ação aprovada",
      description: "A solicitação foi aprovada e executada com sucesso",
    });
  };

  const rejectAction = (actionId: string) => {
    const newActions = pendingActions.filter(a => a.id !== actionId);
    savePendingActions(newActions);
    toast({
      title: "Ação rejeitada",
      description: "A solicitação foi rejeitada",
      variant: "destructive"
    });
  };

  return (
    <CrmContext.Provider value={{
      leads,
      pipelineStages,
      events,
      pendingActions,
      users,
      loading,
      addLead,
      updateLead,
      deleteLead,
      moveLead,
      addEvent,
      updateEvent,
      deleteEvent,
      approveAction,
      rejectAction,
      requestLeadEdit,
      requestLeadDelete,
      addPipelineStage,
      updatePipelineStage,
      deletePipelineStage,
      fetchUsers,
      refreshData
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
