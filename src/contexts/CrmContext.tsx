
import { createContext, useContext, useState, ReactNode } from 'react';

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
}

interface CrmContextType {
  leads: Lead[];
  pipelineStages: PipelineStage[];
  events: Event[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLead: (leadId: string, newStage: string) => void;
  addEvent: (event: Omit<Event, 'id'>) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
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

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      pipelineStage: 'aguardando-inicio'
    };
    setLeads(prev => [...prev, newLead]);
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...updates } : lead
    ));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  const moveLead = (leadId: string, newStage: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === leadId ? { ...lead, pipelineStage: newStage } : lead
    ));
  };

  const addEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, newEvent]);
  };

  return (
    <CrmContext.Provider value={{
      leads,
      pipelineStages,
      events,
      addLead,
      updateLead,
      deleteLead,
      moveLead,
      addEvent
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
