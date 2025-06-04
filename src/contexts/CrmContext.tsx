
import { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  pipelineStages: PipelineStage[];
  events: Event[];
  pendingActions: PendingAction[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLead: (leadId: string, newStage: string) => void;
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
  requestLeadEdit: (leadId: string, updates: Partial<Lead>, user: string) => void;
  requestLeadDelete: (leadId: string, user: string) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: '1',
      name: 'João Silva',
      company: 'Tech Solutions Ltda',
      phone: '47999887766',
      email: 'joao@techsolutions.com',
      niche: 'Tecnologia',
      status: 'Pendente',
      responsible: 'admin@crm.com',
      createdAt: new Date().toISOString(),
      pipelineStage: 'aguardando-inicio'
    },
    {
      id: '2',
      name: 'Maria Santos',
      company: 'Marketing Pro',
      phone: '47888777666',
      email: 'maria@marketingpro.com',
      niche: 'Marketing',
      status: 'Follow-up',
      responsible: 'admin@crm.com',
      createdAt: new Date().toISOString(),
      pipelineStage: 'primeiro-contato'
    }
  ]);

  const [pipelineStages] = useState<PipelineStage[]>([
    { id: 'aguardando-inicio', name: 'Aguardando Início', order: 1, color: '#e11d48' },
    { id: 'primeiro-contato', name: 'Primeiro Contato', order: 2, color: '#f59e0b' },
    { id: 'reuniao', name: 'Reunião', order: 3, color: '#3b82f6' },
    { id: 'proposta-enviada', name: 'Proposta Enviada', order: 4, color: '#8b5cf6' },
    { id: 'negociacao', name: 'Negociação', order: 5, color: '#06b6d4' },
    { id: 'contrato-assinado', name: 'Contrato Assinado', order: 6, color: '#10b981' }
  ]);

  const [events, setEvents] = useState<Event[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      pipelineStage: 'aguardando-inicio'
    };
    setLeads(prev => [...prev, newLead]);
    toast({
      title: "Lead adicionado",
      description: "Lead foi adicionado com sucesso ao pipeline",
    });
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...updates } : lead
    ));
    toast({
      title: "Lead atualizado",
      description: "As alterações foram salvas com sucesso",
    });
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
    // Remove eventos relacionados ao lead
    setEvents(prev => prev.filter(event => event.leadId !== id));
    toast({
      title: "Lead removido",
      description: "Lead foi removido com sucesso",
    });
  };

  const moveLead = (leadId: string, newStage: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, pipelineStage: newStage } : lead
    ));
    
    // Se o lead for movido para fora do estágio "reuniao", remove eventos relacionados
    if (newStage !== 'reuniao') {
      setEvents(prev => prev.filter(event => event.leadId !== leadId));
    }
  };

  const addEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, newEvent]);
    toast({
      title: "Evento adicionado",
      description: "Evento foi agendado com sucesso",
    });
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...updates } : event
    ));
    toast({
      title: "Evento atualizado",
      description: "As alterações foram salvas com sucesso",
    });
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
    toast({
      title: "Evento removido",
      description: "Evento foi removido com sucesso",
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

    setPendingActions(prev => [...prev, action]);
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

    setPendingActions(prev => [...prev, action]);
    toast({
      title: "Solicitação enviada",
      description: "Sua solicitação de exclusão foi enviada para aprovação",
    });
  };

  const approveAction = (actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;

    // Execute a ação
    switch (action.type) {
      case 'edit_lead':
        updateLead(action.data.leadId, action.data.updates);
        break;
      case 'delete_lead':
        deleteLead(action.data.leadId);
        break;
      case 'edit_event':
        updateEvent(action.data.eventId, action.data.updates);
        break;
      case 'delete_event':
        deleteEvent(action.data.eventId);
        break;
    }

    // Remove da lista de ações pendentes
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
    
    toast({
      title: "Ação aprovada",
      description: "A solicitação foi aprovada e executada com sucesso",
    });
  };

  const rejectAction = (actionId: string) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
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
      requestLeadDelete
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
