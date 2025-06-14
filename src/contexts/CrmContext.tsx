import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';

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

interface JourneyMessage {
  id: string;
  title: string;
  content: string;
  delay: number;
  delayUnit: 'minutes' | 'hours' | 'days';
  stage: string;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  order: number;
  created_at: string;
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
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { settings } = useSystemSettingsDB();
  
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

  // Journey message trigger functions
  const scheduleJourneyMessage = async (leadId: string, message: JourneyMessage, leadData: any) => {
    if (!settings.journeyWebhookUrl) return;

    // Calcular delay em milissegundos
    let delayMs = 0;
    switch (message.delayUnit) {
      case 'minutes':
        delayMs = message.delay * 60 * 1000;
        break;
      case 'hours':
        delayMs = message.delay * 60 * 60 * 1000;
        break;
      case 'days':
        delayMs = message.delay * 24 * 60 * 60 * 1000;
        break;
    }

    // Agendar o envio da mensagem
    setTimeout(async () => {
      try {
        const webhookPayload = {
          leadId,
          leadName: leadData.name,
          leadPhone: leadData.phone,
          leadEmail: leadData.email,
          message: {
            title: message.title,
            content: message.content,
            type: message.type,
            mediaUrl: message.mediaUrl
          },
          stage: message.stage,
          timestamp: new Date().toISOString()
        };

        console.log('Enviando mensagem da jornada via webhook:', webhookPayload);

        await fetch(settings.journeyWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log('Mensagem da jornada enviada com sucesso');
      } catch (error) {
        console.error('Erro ao enviar mensagem da jornada:', error);
      }
    }, delayMs);
  };

  const triggerJourneyMessages = (leadId: string, newStage: string, leadData: any) => {
    const savedMessages = localStorage.getItem('journeyMessages');
    if (!savedMessages) return;

    const messages: JourneyMessage[] = JSON.parse(savedMessages);
    const stageMessages = messages
      .filter(m => m.stage === newStage)
      .sort((a, b) => a.order - b.order);

    console.log(`Disparando ${stageMessages.length} mensagens para o lead ${leadId} no estágio ${newStage}`);

    stageMessages.forEach(message => {
      scheduleJourneyMessage(leadId, message, leadData);
    });
  };

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
      if (data) {
        // Transform database events to match our Event interface
        const transformedEvents = data.map(event => ({
          id: event.id,
          title: event.title,
          description: event.lead_name || '',
          start_time: `${event.date}T${event.time}`,
          end_time: `${event.date}T${event.time}`,
          location: event.company || '',
          lead_id: event.lead_id || undefined,
          user_id: event.responsible_id,
          created_at: event.created_at,
          updated_at: event.created_at
        }));
        setEvents(transformedEvents);
      }
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
    if (profile?.role === 'comercial') {
      await requestAction({
        type: 'delete_lead',
        user_name: user?.email || 'Usuário',
        description: `Solicitação para excluir lead: ${leads.find(l => l.id === id)?.name}`,
        details: { leadId: id, leadName: leads.find(l => l.id === id)?.name }
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
    if (profile?.role === 'comercial') {
      await requestAction({
        type: 'edit_lead',
        user_name: user?.email || 'Usuário',
        description: `Solicitação para editar lead: ${leads.find(l => l.id === id)?.name}`,
        details: { leadId: id, leadName: leads.find(l => l.id === id)?.name, changes: updates }
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
      // Transform Event interface to database format
      const dbEventData = {
        title: eventData.title,
        lead_name: eventData.description || '',
        date: eventData.start_time.split('T')[0],
        time: eventData.start_time.split('T')[1],
        company: eventData.location || '',
        lead_id: eventData.lead_id || null,
        responsible_id: eventData.user_id || user?.id || '',
        type: 'meeting'
      };

      const { data, error } = await supabase
        .from('events')
        .insert([dbEventData])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        // Transform back to Event interface
        const transformedEvent = {
          id: data.id,
          title: data.title,
          description: data.lead_name || '',
          start_time: `${data.date}T${data.time}`,
          end_time: `${data.date}T${data.time}`,
          location: data.company || '',
          lead_id: data.lead_id || undefined,
          user_id: data.responsible_id,
          created_at: data.created_at,
          updated_at: data.created_at
        };
        setEvents(prev => [...prev, transformedEvent]);
      }
      
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
      // Transform Event interface updates to database format
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.lead_name = updates.description;
      if (updates.location) dbUpdates.company = updates.location;
      if (updates.lead_id !== undefined) dbUpdates.lead_id = updates.lead_id;
      if (updates.user_id) dbUpdates.responsible_id = updates.user_id;
      if (updates.start_time) {
        dbUpdates.date = updates.start_time.split('T')[0];
        dbUpdates.time = updates.start_time.split('T')[1];
      }

      const { data, error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        // Transform back to Event interface
        const transformedEvent = {
          id: data.id,
          title: data.title,
          description: data.lead_name || '',
          start_time: `${data.date}T${data.time}`,
          end_time: `${data.date}T${data.time}`,
          location: data.company || '',
          lead_id: data.lead_id || undefined,
          user_id: data.responsible_id,
          created_at: data.created_at,
          updated_at: data.created_at
        };
        setEvents(prev => prev.map(event => event.id === id ? transformedEvent : event));
      }
      
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

      const actionDetails = action.details as ActionDetails;

      if (action.type === 'delete_lead' && actionDetails.leadId) {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', actionDetails.leadId);

        if (error) throw error;
        setLeads(prev => prev.filter(lead => lead.id !== actionDetails.leadId));
      } else if (action.type === 'edit_lead' && actionDetails.leadId && actionDetails.changes) {
        const { data, error } = await supabase
          .from('leads')
          .update(actionDetails.changes)
          .eq('id', actionDetails.leadId)
          .select()
          .single();
          
        if (error) throw error;
        if (data) {
          setLeads(prev => prev.map(lead => lead.id === actionDetails.leadId ? data : lead));
        }
      } else if (action.type === 'delete_event' && actionDetails.eventId) {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', actionDetails.eventId);

        if (error) throw error;
        setEvents(prev => prev.filter(event => event.id !== actionDetails.eventId));
      } else if (action.type === 'edit_event' && actionDetails.eventId && actionDetails.changes) {
        const { data, error } = await supabase
          .from('events')
          .update(actionDetails.changes)
          .eq('id', actionDetails.eventId)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const transformedEvent = {
            id: data.id,
            title: data.title,
            description: data.lead_name || '',
            start_time: `${data.date}T${data.time}`,
            end_time: `${data.date}T${data.time}`,
            location: data.company || '',
            lead_id: data.lead_id || undefined,
            user_id: data.responsible_id,
            created_at: data.created_at,
            updated_at: data.created_at
          };
          setEvents(prev => prev.map(event => event.id === actionDetails.eventId ? transformedEvent : event));
        }
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
