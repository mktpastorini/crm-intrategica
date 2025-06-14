import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  address: string;
  niche: string;
  status: string;
  category: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  lead_id: string;
  user_id: string;
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

interface CrmContextType {
  leads: Lead[];
  users: User[];
  events: Event[];
  pendingActions: PendingAction[];
  messageTemplates: MessageTemplate[];
  loading: boolean;
  addLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  approveAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
  saveMessageTemplate: (template: Omit<MessageTemplate, 'id'>) => Promise<void>;
  loadMessageTemplates: () => Promise<void>;
  deleteMessageTemplate: (id: string) => Promise<void>;
  sendBulkMessage: (recipientIds: string[], message: string, category?: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*');

      if (leadsError) {
        console.error('Erro ao carregar leads:', leadsError);
      } else {
        setLeads(leadsData || []);
      }

      // Users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError);
      } else {
        setUsers(usersData || []);
      }

      // Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');

      if (eventsError) {
        console.error('Erro ao carregar eventos:', eventsError);
      } else {
        setEvents(eventsData || []);
      }
    } finally {
      setLoading(false);
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

  const addLead = async (lead: Omit<Lead, 'id'>) => {
    if (profile?.role === 'comercial') {
      await requestAction({
        type: 'add_lead',
        user: profile.name,
        description: `Solicitação para adicionar novo lead: ${lead.name}`,
        details: { leadData: lead }
      });
      return;
    }

    const newLead: Lead = {
      id: crypto.randomUUID(),
      ...lead,
    };
    setLeads(prev => [...prev, newLead]);
    
    toast({
      title: "Lead adicionado",
      description: `Lead ${lead.name} foi adicionado com sucesso.`,
    });
  };

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

    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...leadData } : lead
    ));
    
    toast({
      title: "Lead atualizado",
      description: `Lead ${existingLead.name} foi atualizado com sucesso.`,
    });
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

    setLeads(prev => prev.filter(lead => lead.id !== id));
    
    toast({
      title: "Lead excluído",
      description: `Lead ${leadToDelete.name} foi excluído com sucesso.`,
    });
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    const newUser: User = {
      id: crypto.randomUUID(),
      ...user,
    };
    setUsers(prev => [...prev, newUser]);
    
    toast({
      title: "Usuário adicionado",
      description: `Usuário ${user.name} foi adicionado com sucesso.`,
    });
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...userData } : user
    ));
    
    toast({
      title: "Usuário atualizado",
      description: `Usuário foi atualizado com sucesso.`,
    });
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    
    toast({
      title: "Usuário excluído",
      description: "Usuário excluído com sucesso.",
    });
  };

  const addEvent = async (event: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      id: crypto.randomUUID(),
      ...event,
    };
    setEvents(prev => [...prev, newEvent]);
    
    toast({
      title: "Evento adicionado",
      description: `Evento ${event.title} foi adicionado com sucesso.`,
    });
  };

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

    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...eventData } : event
    ));
    
    toast({
      title: "Evento atualizado",
      description: `Evento ${existingEvent.title} foi atualizado com sucesso.`,
    });
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

    setEvents(prev => prev.filter(event => event.id !== id));
    
    toast({
      title: "Evento excluído",
      description: `Evento ${eventToDelete.title} foi excluído com sucesso.`,
    });
  };

  const approveAction = async (actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;

    // Execute the action based on type
    switch (action.type) {
      case 'add_lead':
        if (action.details?.leadData) {
          const newLead: Lead = {
            id: crypto.randomUUID(),
            ...action.details.leadData,
          };
          setLeads(prev => [...prev, newLead]);
        }
        break;
      case 'edit_lead':
        if (action.details?.changes) {
          const leadToUpdate = leads.find(l => l.name === action.details?.leadName);
          if (leadToUpdate) {
            setLeads(prev => prev.map(lead => 
              lead.id === leadToUpdate.id ? { ...lead, ...action.details.changes } : lead
            ));
          }
        }
        break;
      case 'delete_lead':
        const leadToDelete = leads.find(l => l.name === action.details?.leadName);
        if (leadToDelete) {
          setLeads(prev => prev.filter(lead => lead.id !== leadToDelete.id));
        }
        break;
      case 'edit_event':
        if (action.details?.changes) {
          const eventToUpdate = events.find(e => e.title === action.details?.eventTitle);
          if (eventToUpdate) {
            setEvents(prev => prev.map(event => 
              event.id === eventToUpdate.id ? { ...event, ...action.details.changes } : event
            ));
          }
        }
        break;
      case 'delete_event':
        const eventToDelete = events.find(e => e.title === action.details?.eventTitle);
        if (eventToDelete) {
          setEvents(prev => prev.filter(event => event.id !== eventToDelete.id));
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

      const webhookUrl = settings?.messageWebhookUrl;

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

  const value = {
    leads,
    users,
    events,
    pendingActions,
    messageTemplates,
    loading,
    addLead,
    updateLead,
    deleteLead,
    addUser,
    updateUser,
    deleteUser,
    addEvent,
    updateEvent,
    deleteEvent,
    approveAction,
    rejectAction,
    saveMessageTemplate,
    loadMessageTemplates,
    deleteMessageTemplate,
    sendBulkMessage,
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
