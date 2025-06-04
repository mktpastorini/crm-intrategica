
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
  
  // Carregar leads do localStorage com fallback
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('leads');
    return saved ? JSON.parse(saved) : [
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
    ];
  });

  // Carregar estágios do pipeline do localStorage com fallback
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

  // Carregar eventos do localStorage com fallback
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('events');
    return saved ? JSON.parse(saved) : [];
  });

  // Carregar ações pendentes do localStorage com fallback
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => {
    const saved = localStorage.getItem('pendingActions');
    return saved ? JSON.parse(saved) : [];
  });

  // Salvar no localStorage sempre que os dados mudarem
  const saveLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    localStorage.setItem('leads', JSON.stringify(newLeads));
  };

  const savePipelineStages = (newStages: PipelineStage[]) => {
    setPipelineStages(newStages);
    localStorage.setItem('pipelineStages', JSON.stringify(newStages));
  };

  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    localStorage.setItem('events', JSON.stringify(newEvents));
  };

  const savePendingActions = (newActions: PendingAction[]) => {
    setPendingActions(newActions);
    localStorage.setItem('pendingActions', JSON.stringify(newActions));
  };

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      pipelineStage: 'aguardando-inicio'
    };
    const newLeads = [...leads, newLead];
    saveLeads(newLeads);
    toast({
      title: "Lead adicionado",
      description: "Lead foi adicionado com sucesso ao pipeline",
    });
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    const newLeads = leads.map(lead => 
      lead.id === id ? { ...lead, ...updates } : lead
    );
    saveLeads(newLeads);
    toast({
      title: "Lead atualizado",
      description: "As alterações foram salvas com sucesso",
    });
  };

  const deleteLead = (id: string) => {
    const newLeads = leads.filter(lead => lead.id !== id);
    saveLeads(newLeads);
    
    // Remove eventos relacionados ao lead
    const newEvents = events.filter(event => event.leadId !== id);
    saveEvents(newEvents);
    
    toast({
      title: "Lead removido",
      description: "Lead foi removido com sucesso",
    });
  };

  const moveLead = (leadId: string, newStage: string) => {
    const newLeads = leads.map(lead => 
      lead.id === leadId ? { ...lead, pipelineStage: newStage } : lead
    );
    saveLeads(newLeads);
    
    // Se o lead for movido para fora do estágio "reuniao", remove eventos relacionados
    if (newStage !== 'reuniao') {
      const newEvents = events.filter(event => event.leadId !== leadId);
      saveEvents(newEvents);
    }
  };

  const addEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString()
    };
    const newEvents = [...events, newEvent];
    saveEvents(newEvents);
    toast({
      title: "Evento adicionado",
      description: "Evento foi agendado com sucesso",
    });
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    const newEvents = events.map(event => 
      event.id === id ? { ...event, ...updates } : event
    );
    saveEvents(newEvents);
    toast({
      title: "Evento atualizado",
      description: "As alterações foram salvas com sucesso",
    });
  };

  const deleteEvent = (id: string) => {
    const newEvents = events.filter(event => event.id !== id);
    saveEvents(newEvents);
    toast({
      title: "Evento removido",
      description: "Evento foi removido com sucesso",
    });
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
