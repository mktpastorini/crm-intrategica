import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  address?: string;
  niche: string;
  status: string;
  responsible_id: string;
  created_at: string;
  updated_at: string;
  rating?: number;
  place_id?: string;
  instagram?: string;
  pipeline_stage?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  lead_id?: string;
  lead_name?: string;
  company?: string;
  type: string;
  responsible_id: string;
  completed?: boolean;
  created_at: string;
}

interface PendingAction {
  id: string;
  type: string;
  user: string;
  description: string;
  timestamp: string;
  details?: any;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface CrmContextType {
  leads: Lead[];
  users: User[];
  events: Event[];
  pendingActions: PendingAction[];
  messageTemplates: MessageTemplate[];
  pipelineStages: PipelineStage[];
  loading: boolean;
  actionLoading: string | null;
  loadData: () => Promise<void>;
  loadLeads: () => Promise<void>;
  loadUsers: () => Promise<void>;
  createLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'created_at'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  createEvent: (event: Omit<Event, 'id' | 'created_at'>) => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'created_at'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  approveAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
  saveMessageTemplate: (template: Omit<MessageTemplate, 'id'>) => Promise<void>;
  loadMessageTemplates: () => Promise<void>;
  deleteMessageTemplate: (id: string) => Promise<void>;
  sendBulkMessage: (recipientIds: string[], message: string, category?: string) => Promise<void>;
  addPipelineStage: (stage: Omit<PipelineStage, 'id'>) => Promise<void>;
  updatePipelineStage: (id: string, stage: Partial<PipelineStage>) => Promise<void>;
  deletePipelineStage: (id: string) => Promise<void>;
  savePipelineStages: (stages: PipelineStage[]) => Promise<void>;
  moveLead: (leadId: string, newStage: string) => Promise<void>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { id: 'prospeccao', name: 'Prospecção', color: '#3b82f6', order: 1 },
    { id: 'qualificacao', name: 'Qualificação', color: '#8b5cf6', order: 2 },
    { id: 'proposta', name: 'Proposta', color: '#f59e0b', order: 3 },
    { id: 'negociacao', name: 'Negociação', color: '#ef4444', order: 4 },
    { id: 'reuniao', name: 'Reunião', color: '#10b981', order: 5 },
    { id: 'fechamento', name: 'Fechamento', color: '#06b6d4', order: 6 }
  ]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadPipelineStages();
  }, [user]);

  const loadPipelineStages = () => {
    const saved = localStorage.getItem('pipelineStages');
    if (saved) {
      setPipelineStages(JSON.parse(saved));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadLeads(), loadUsers(), loadEvents()]);
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) {
        console.error('Erro ao carregar leads:', leadsError);
        toast({
          title: "Erro",
          description: "Erro ao carregar leads",
          variant: "destructive",
        });
      } else {
        setLeads(leadsData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError);
        toast({
          title: "Erro",
          description: "Erro ao carregar usuários",
          variant: "destructive",
        });
      } else {
        setUsers(usersData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('Erro ao carregar eventos:', eventsError);
        toast({
          title: "Erro",
          description: "Erro ao carregar eventos",
          variant: "destructive",
        });
      } else {
        setEvents(eventsData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  };

  const requestAction = async (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const newAction: PendingAction = {
      id: crypto.randomUUID(),
      ...action,
      timestamp: new Date().toLocaleString('pt-BR'),
    };

    setPendingActions(prev => [...prev, newAction]);

    toast({
      title: "Solicitação enviada",
      description: "Sua solicitação foi enviada para aprovação do supervisor.",
    });

    return newAction.id;
  };

  const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    setActionLoading('create-lead');
    try {
      if (profile?.role === 'comercial') {
        await requestAction({
          type: 'add_lead',
          user: profile.name,
          description: `Solicitação para adicionar novo lead: ${leadData.name}`,
          details: { leadData }
        });
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...leadData,
          whatsapp: leadData.whatsapp || leadData.phone
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setLeads(prev => [data, ...prev]);
        toast({
          title: "Lead criado",
          description: `Lead ${leadData.name} foi criado com sucesso.`,
        });
      }
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
  };

  const addLead = createLead;

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    const existingLead = leads.find(l => l.id === id);
    if (!existingLead) return;

    if (profile?.role === 'comercial') {
      await requestAction({
        type: 'edit_lead',
        user: profile.name,
        description: `Solicitação para editar lead: ${existingLead.name}`,
        details: { 
          leadName: existingLead.name,
          changes: leadData 
        }
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setLeads(prev => prev.map(lead => 
          lead.id === id ? data : lead
        ));
        
        toast({
          title: "Lead atualizado",
          description: `Lead ${existingLead.name} foi atualizado com sucesso.`,
        });
      }
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
    const leadToDelete = leads.find(l => l.id === id);
    if (!leadToDelete) return;

    if (profile?.role === 'comercial') {
      await requestAction({
        type: 'delete_lead',
        user: profile.name,
        description: `Solicitação para excluir lead: ${leadToDelete.name}`,
        details: { leadName: leadToDelete.name }
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setLeads(prev => prev.filter(lead => lead.id !== id));
      
      toast({
        title: "Lead excluído",
        description: `Lead ${leadToDelete.name} foi excluído com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao excluir lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir lead",
        variant: "destructive",
      });
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...userData,
          id: crypto.randomUUID()
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUsers(prev => [data, ...prev]);
        toast({
          title: "Usuário adicionado",
          description: `Usuário ${userData.name} foi adicionado com sucesso.`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar usuário",
        variant: "destructive",
      });
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUsers(prev => prev.map(user => 
          user.id === id ? data : user
        ));
        
        toast({
          title: "Usuário atualizado",
          description: `Usuário foi atualizado com sucesso.`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setUsers(prev => prev.filter(user => user.id !== id));
      
      toast({
        title: "Usuário excluído",
        description: "Usuário excluído com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setEvents(prev => [data, ...prev]);
        toast({
          title: "Evento criado",
          description: `Evento ${eventData.title} foi criado com sucesso.`,
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar evento",
        variant: "destructive",
      });
    }
  };

  const addEvent = createEvent;

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    const existingEvent = events.find(e => e.id === id);
    if (!existingEvent) return;

    if (profile?.role === 'comercial') {
      await requestAction({
        type: 'edit_event',
        user: profile.name,
        description: `Solicitação para editar evento: ${existingEvent.title}`,
        details: { 
          eventTitle: existingEvent.title,
          changes: eventData 
        }
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setEvents(prev => prev.map(event => 
          event.id === id ? data : event
        ));
        
        toast({
          title: "Evento atualizado",
          description: `Evento ${existingEvent.title} foi atualizado com sucesso.`,
        });
      }
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
    const eventToDelete = events.find(e => e.id === id);
    if (!eventToDelete) return;

    if (profile?.role === 'comercial') {
      await requestAction({
        type: 'delete_event',
        user: profile.name,
        description: `Solicitação para excluir evento: ${eventToDelete.title}`,
        details: { eventTitle: eventToDelete.title }
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setEvents(prev => prev.filter(event => event.id !== id));
      
      toast({
        title: "Evento excluído",
        description: `Evento ${eventToDelete.title} foi excluído com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao excluir evento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir evento",
        variant: "destructive",
      });
    }
  };

  const approveAction = async (actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;

    // Execute the action based on type
    switch (action.type) {
      case 'add_lead':
        if (action.details?.leadData) {
          await createLead(action.details.leadData);
        }
        break;
      case 'edit_lead':
        if (action.details?.changes) {
          const leadToUpdate = leads.find(l => l.name === action.details?.leadName);
          if (leadToUpdate) {
            await updateLead(leadToUpdate.id, action.details.changes);
          }
        }
        break;
      case 'delete_lead':
        const leadToDelete = leads.find(l => l.name === action.details?.leadName);
        if (leadToDelete) {
          await deleteLead(leadToDelete.id);
        }
        break;
      case 'edit_event':
        if (action.details?.changes) {
          const eventToUpdate = events.find(e => e.title === action.details?.eventTitle);
          if (eventToUpdate) {
            await updateEvent(eventToUpdate.id, action.details.changes);
          }
        }
        break;
      case 'delete_event':
        const eventToDelete = events.find(e => e.title === action.details?.eventTitle);
        if (eventToDelete) {
          await deleteEvent(eventToDelete.id);
        }
        break;
    }

    setPendingActions(prev => prev.filter(a => a.id !== actionId));
    
    toast({
      title: "Ação aprovada",
      description: "A solicitação foi aprovada com sucesso.",
    });
  };

  const rejectAction = async (actionId: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
    
    toast({
      title: "Ação rejeitada",
      description: "A solicitação foi rejeitada.",
      variant: "destructive",
    });
  };

  const saveMessageTemplate = async (template: Omit<MessageTemplate, 'id'>) => {
    const newTemplate: MessageTemplate = {
      id: crypto.randomUUID(),
      ...template,
    };
    setMessageTemplates(prev => [...prev, newTemplate]);
    
    toast({
      title: "Template salvo",
      description: `Template "${template.name}" foi salvo com sucesso.`,
    });
  };

  const loadMessageTemplates = async () => {
    // Templates are already loaded in memory
  };

  const deleteMessageTemplate = async (id: string) => {
    const template = messageTemplates.find(t => t.id === id);
    setMessageTemplates(prev => prev.filter(t => t.id !== id));
    
    if (template) {
      toast({
        title: "Template excluído",
        description: `Template "${template.name}" foi excluído.`,
      });
    }
  };

  const sendBulkMessage = async (recipientIds: string[], message: string, category?: string) => {
    try {
      // Get system settings for webhook URL
      const { data: settings } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      const webhookUrl = settings?.message_webhook_url;

      if (webhookUrl) {
        // Send to webhook
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipientIds,
            message,
            category,
            timestamp: new Date().toISOString(),
            sender: user?.email,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao enviar para webhook');
        }
      }

      toast({
        title: "Mensagens enviadas",
        description: `${recipientIds.length} mensagem(ns) enviada(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error);
      toast({
        title: "Erro no envio",
        description: "Ocorreu um erro ao enviar as mensagens.",
        variant: "destructive",
      });
    }
  };

  const addPipelineStage = async (stage: Omit<PipelineStage, 'id'>) => {
    const newStage: PipelineStage = {
      id: crypto.randomUUID(),
      ...stage,
    };
    const newStages = [...pipelineStages, newStage];
    setPipelineStages(newStages);
    localStorage.setItem('pipelineStages', JSON.stringify(newStages));
    
    toast({
      title: "Estágio adicionado",
      description: `Estágio "${stage.name}" foi adicionado com sucesso.`,
    });
  };

  const updatePipelineStage = async (id: string, stage: Partial<PipelineStage>) => {
    const newStages = pipelineStages.map(s => s.id === id ? { ...s, ...stage } : s);
    setPipelineStages(newStages);
    localStorage.setItem('pipelineStages', JSON.stringify(newStages));
    
    toast({
      title: "Estágio atualizado",
      description: "Estágio foi atualizado com sucesso.",
    });
  };

  const deletePipelineStage = async (id: string) => {
    const newStages = pipelineStages.filter(s => s.id !== id);
    setPipelineStages(newStages);
    localStorage.setItem('pipelineStages', JSON.stringify(newStages));
    
    toast({
      title: "Estágio excluído",
      description: "Estágio foi excluído com sucesso.",
    });
  };

  const savePipelineStages = async (stages: PipelineStage[]) => {
    setPipelineStages(stages);
    localStorage.setItem('pipelineStages', JSON.stringify(stages));
    
    toast({
      title: "Estágios salvos",
      description: "Configuração dos estágios foi salva com sucesso.",
    });
  };

  const moveLead = async (leadId: string, newStage: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ pipeline_stage: newStage })
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? data : lead
        ));
      }
    } catch (error: any) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao mover lead",
        variant: "destructive",
      });
    }
  };

  const value = {
    leads,
    users,
    events,
    pendingActions,
    messageTemplates,
    pipelineStages,
    loading,
    actionLoading,
    loadData,
    loadLeads,
    loadUsers,
    createLead,
    addLead,
    updateLead,
    deleteLead,
    addUser,
    updateUser,
    deleteUser,
    createEvent,
    addEvent,
    updateEvent,
    deleteEvent,
    approveAction,
    rejectAction,
    saveMessageTemplate,
    loadMessageTemplates,
    deleteMessageTemplate,
    sendBulkMessage,
    addPipelineStage,
    updatePipelineStage,
    deletePipelineStage,
    savePipelineStages,
    moveLead,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (context === undefined) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
}
