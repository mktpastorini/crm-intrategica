import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useJourneyMessageTrigger } from '@/hooks/useJourneyMessageTrigger';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  title?: string;
  source?: string;
  owner_id?: string;
  pipeline_stage?: string;
  status?: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  lead_id?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface PendingAction {
  id: string;
  type: string;
  user_name: string;
  description: string;
  details: ActionDetails;
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ActionDetails {
  leadId?: string;
  leadName?: string;
  eventId?: string;
  eventTitle?: string;
  changes?: Record<string, any>;
}

interface CrmContextType {
  leads: Lead[];
  events: Event[];
  pipelineStages: PipelineStage[];
  categories: Category[];
  pendingActions: PendingAction[];
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  requestAction: (action: Omit<PendingAction, 'id' | 'created_at'>) => Promise<void>;
  approveAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
  loadPendingActions: () => Promise<void>;
  loadLeads: () => Promise<void>;
  loadEvents: () => Promise<void>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { triggerJourneyMessages } = useJourneyMessageTrigger();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { id: '1', name: 'Qualificação', description: 'Primeiro contato com o lead', order: 1, color: '#6366F1' },
    { id: '2', name: 'Proposta', description: 'Apresentação da proposta comercial', order: 2, color: '#22C55E' },
    { id: '3', name: 'Negociação', description: 'Ajustes finais e negociação', order: 3, color: '#F59E0B' },
    { id: '4', name: 'Fechamento', description: 'Assinatura do contrato e fechamento', order: 4, color: '#E11D48' },
  ]);
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Marketing', description: 'Leads vindos de ações de marketing' },
    { id: '2', name: 'Indicação', description: 'Leads indicados por clientes' },
    { id: '3', name: 'Outros', description: 'Outras fontes de leads' },
  ]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    loadLeads();
    loadEvents();
    loadPendingActions();
  }, []);

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data);
    } catch (error: any) {
      console.error('Erro ao carregar leads:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leads",
        variant: "destructive",
      });
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      if (data) setEvents(data);
    } catch (error: any) {
      console.error('Erro ao carregar eventos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (id: string) => {
    if (userRole === 'comercial') {
      await requestAction({
        type: 'delete_lead',
        user_name: user?.email || 'Usuário',
        description: `Solicitação para excluir lead: ${leads.find(l => l.id === id)?.name}`,
        details: { leadId: id }
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast({
        title: "Lead excluído",
        description: "Lead foi excluído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir lead",
        variant: "destructive",
      });
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (userRole === 'comercial') {
      await requestAction({
        type: 'edit_lead',
        user_name: user?.email || 'Usuário',
        description: `Solicitação para editar lead: ${leads.find(l => l.id === id)?.name}`,
        details: { leadId: id, changes: updates }
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Verificar se o estágio mudou para disparar mensagens da jornada
        const oldLead = leads.find(l => l.id === id);
        if (oldLead && updates.pipeline_stage && oldLead.pipeline_stage !== updates.pipeline_stage) {
          console.log(`Lead ${id} mudou do estágio ${oldLead.pipeline_stage} para ${updates.pipeline_stage}`);
          triggerJourneyMessages(id, updates.pipeline_stage, data);
        }

        setLeads(prev => prev.map(lead => lead.id === id ? data : lead));
        
        toast({
          title: "Lead atualizado",
          description: "Lead foi atualizado com sucesso",
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar lead",
        variant: "destructive",
      });
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setLeads(prev => [...prev, data]);
        
        // Disparar mensagens da jornada para o novo lead
        if (data.pipeline_stage) {
          console.log(`Novo lead ${data.id} adicionado no estágio ${data.pipeline_stage}`);
          triggerJourneyMessages(data.id, data.pipeline_stage, data);
        }
        
        toast({
          title: "Lead criado",
          description: "Lead foi criado com sucesso",
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar lead",
        variant: "destructive",
      });
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;
      if (data) setEvents(prev => [...prev, data]);
      toast({
        title: "Evento criado",
        description: "Evento foi criado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar evento",
        variant: "destructive",
      });
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) setEvents(prev => prev.map(event => event.id === id ? data : event));
      toast({
        title: "Evento atualizado",
        description: "Evento foi atualizado com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar evento",
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
      setEvents(prev => prev.filter(event => event.id !== id));
      toast({
        title: "Evento excluído",
        description: "Evento foi excluído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir evento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir evento",
        variant: "destructive",
      });
    }
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: `cat-${Date.now()}` }]);
    toast({
      title: "Categoria criada",
      description: "Categoria foi criada com sucesso",
    });
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
    toast({
      title: "Categoria atualizada",
      description: "Categoria foi atualizada com sucesso",
    });
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
    toast({
      title: "Categoria excluída",
      description: "Categoria foi excluída com sucesso",
    });
  };

  const requestAction = async (action: Omit<PendingAction, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('pending_actions')
        .insert([
          {
            ...action,
            status: 'pending',
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPendingActions(prev => [...prev, data]);
        toast({
          title: "Solicitação enviada",
          description: "Aguardando aprovação do supervisor",
        });
      }
    } catch (error: any) {
      console.error('Erro ao solicitar ação:', error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar ação",
        variant: "destructive",
      });
    }
  };

  const approveAction = async (actionId: string) => {
    try {
      const action = pendingActions.find(a => a.id === actionId);
      if (!action) throw new Error('Ação não encontrada');

      if (action.type === 'delete_lead' && action.details.leadId) {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', action.details.leadId);

        if (error) throw error;
        setLeads(prev => prev.filter(lead => lead.id !== action.details.leadId));
      } else if (action.type === 'edit_lead' && action.details.leadId && action.details.changes) {
        const { data, error } = await supabase
          .from('leads')
          .update(action.details.changes)
          .eq('id', action.details.leadId)
          .select()
          .single();
          
        if (error) throw error;
        setLeads(prev => prev.map(lead => lead.id === action.details.leadId ? { ...lead, ...action.details.changes } : lead));
      } else if (action.type === 'delete_event' && action.details.eventId) {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', action.details.eventId);

        if (error) throw error;
        setEvents(prev => prev.filter(event => event.id !== action.details.eventId));
      } else if (action.type === 'edit_event' && action.details.eventId && action.details.changes) {
        const { data, error } = await supabase
          .from('events')
          .update(action.details.changes)
          .eq('id', action.details.eventId)
          .select()
          .single();

        if (error) throw error;
        setEvents(prev => prev.map(event => event.id === action.details.eventId ? { ...event, ...action.details.changes } : event));
      }

      // Update pending action status
      const { error: updateError } = await supabase
        .from('pending_actions')
        .update({ status: 'approved' })
        .eq('id', actionId);

      if (updateError) throw updateError;

      setPendingActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'approved' } : a));

      toast({
        title: "Ação aprovada",
        description: "Ação foi aprovada com sucesso",
      });
      loadLeads();
      loadEvents();
    } catch (error: any) {
      console.error('Erro ao aprovar ação:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar ação",
        variant: "destructive",
      });
    }
  };

  const rejectAction = async (actionId: string) => {
    try {
       // Update pending action status to 'rejected' in the database
       const { error } = await supabase
       .from('pending_actions')
       .update({ status: 'rejected' })
       .eq('id', actionId);
 
     if (error) {
       throw error;
     }
      setPendingActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'rejected' } : a));
      toast({
        title: "Ação rejeitada",
        description: "Ação foi rejeitada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao rejeitar ação:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar ação",
        variant: "destructive",
      });
    }
  };

  const loadPendingActions = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPendingActions(data);
    } catch (error: any) {
      console.error('Erro ao carregar solicitações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações",
        variant: "destructive",
      });
    }
  };

  return (
    <CrmContext.Provider value={{
      leads,
      events,
      pipelineStages,
      categories,
      pendingActions,
      addLead,
      updateLead,
      deleteLead,
      addEvent,
      updateEvent,
      deleteEvent,
      addCategory,
      updateCategory,
      deleteCategory,
      requestAction,
      approveAction,
      rejectAction,
      loadPendingActions,
      loadLeads,
      loadEvents,
    }}>
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
