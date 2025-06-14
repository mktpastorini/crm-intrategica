import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { securityHelpers } from '@/utils/securityHelpers';
import { inputValidation } from '@/utils/inputValidation';
import { useDailyActivityTracker } from '@/hooks/useDailyActivityTracker';

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
  website?: string;
  address?: string;
  rating?: number;
  place_id?: string;
  whatsapp?: string;
}

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  company?: string;
  lead_name?: string;
  responsible_id: string;
  lead_id?: string;
  completed?: boolean;
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
  type: 'edit_lead' | 'delete_lead' | 'edit_event' | 'delete_event';
  description: string;
  user: string;
  timestamp: string;
  details?: {
    leadName?: string;
    eventTitle?: string;
    changes?: Record<string, any>;
    originalData?: any;
    targetId: string;
  };
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
  updateEvent: (eventId: string, updates: any) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addEvent: (eventData: Omit<Event, 'id' | 'created_at'>) => Promise<void>;
  
  // Users
  loadUsers: () => Promise<void>;
  createUser: (userData: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  // Pipeline Stages
  loadPipelineStages: () => Promise<void>;
  savePipelineStages: (stages: PipelineStage[]) => Promise<void>;
  addPipelineStage: (stage: Omit<PipelineStage, 'id'>) => Promise<void>;
  updatePipelineStage: (id: string, stage: Partial<PipelineStage>) => Promise<void>;
  deletePipelineStage: (id: string) => Promise<void>;
  
  // Supervision
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

// Default pipeline stages
const defaultPipelineStages: PipelineStage[] = [
  { id: 'aguardando-inicio', name: 'Aguardando Início', color: '#94a3b8', order: 1 },
  { id: 'novo', name: 'Novo', color: '#3b82f6', order: 2 },
  { id: 'contato-inicial', name: 'Contato Inicial', color: '#f59e0b', order: 3 },
  { id: 'qualificacao', name: 'Qualificação', color: '#8b5cf6', order: 4 },
  { id: 'reuniao', name: 'Reunião', color: '#06b6d4', order: 5 },
  { id: 'proposta-enviada', name: 'Proposta Enviada', color: '#ef4444', order: 6 },
  { id: 'contrato-assinado', name: 'Contrato Assinado', color: '#10b981', order: 7 }
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
  const { trackLeadMoved } = useDailyActivityTracker();

  // Helper function to send webhook with security validation
  const sendWebhook = async (webhookUrl: string, data: any) => {
    if (!webhookUrl) return;
    
    // Validate webhook URL
    if (!inputValidation.validateWebhookUrl(webhookUrl)) {
      console.error('Invalid webhook URL:', webhookUrl);
      return;
    }

    // Check rate limiting
    const rateLimitKey = `webhook_${webhookUrl}`;
    if (!securityHelpers.rateLimiter.isAllowed(rateLimitKey, 10, 60000)) {
      console.error('Webhook rate limit exceeded for:', webhookUrl);
      return;
    }
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: securityHelpers.generateWebhookHeaders(),
        mode: 'no-cors',
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          source: 'crm-system'
        }),
      });
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
    }
  };

  // Helper function to send journey message
  const sendJourneyMessage = async (leadId: string, newStage: string) => {
    try {
      const settings = localStorage.getItem('systemSettings');
      if (!settings) return;
      
      const { journeyWebhookUrl } = JSON.parse(settings);
      if (!journeyWebhookUrl) return;

      const lead = leads.find(l => l.id === leadId);
      if (!lead) return;

      const journeyData = localStorage.getItem('journeyTemplates');
      if (!journeyData) return;

      const templates = JSON.parse(journeyData);
      const template = templates.find((t: any) => t.stage === newStage);
      if (!template) return;

      await sendWebhook(journeyWebhookUrl, {
        lead_name: lead.name,
        lead_email: lead.email,
        lead_phone: lead.phone,
        company: lead.company,
        stage: newStage,
        message: template.message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem da jornada:', error);
    }
  };

  // Load Pipeline Stages from localStorage with fallback
  const loadPipelineStages = useCallback(async () => {
    try {
      const savedStages = localStorage.getItem('pipelineStages');
      if (savedStages) {
        const stages = JSON.parse(savedStages);
        setPipelineStages(stages);
        console.log('Pipeline stages carregados do localStorage:', stages);
      } else {
        // Se não há nada salvo, usar os padrões
        setPipelineStages(defaultPipelineStages);
        localStorage.setItem('pipelineStages', JSON.stringify(defaultPipelineStages));
      }
    } catch (error) {
      console.error('Erro ao carregar pipeline stages:', error);
      setPipelineStages(defaultPipelineStages);
    }
  }, []);

  // Save Pipeline Stages to localStorage
  const savePipelineStages = useCallback(async (stages: PipelineStage[]) => {
    try {
      console.log('Salvando pipeline stages:', stages);
      localStorage.setItem('pipelineStages', JSON.stringify(stages));
      setPipelineStages(stages);
      
      toast({
        title: "Estágios salvos",
        description: "Estágios do pipeline foram salvos com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar pipeline stages:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar estágios do pipeline",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Load Leads with proper validation
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
        description: error.message || "Erro ao carregar leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create Lead with validation and sanitization
  const createLead = useCallback(async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('Criando lead:', leadData);
      setActionLoading('create-lead');

      // Validate input data
      if (!inputValidation.validateRequired(leadData.name)) {
        throw new Error('Nome é obrigatório');
      }

      if (!inputValidation.validateRequired(leadData.company)) {
        throw new Error('Empresa é obrigatória');
      }

      if (!inputValidation.validatePhone(leadData.phone)) {
        throw new Error('Telefone inválido');
      }

      if (leadData.email && !inputValidation.validateEmail(leadData.email)) {
        throw new Error('Email inválido');
      }

      if (leadData.website && !inputValidation.validateUrl(leadData.website)) {
        throw new Error('Website inválido');
      }

      // Sanitize input data
      const sanitizedLeadData = {
        ...leadData,
        name: inputValidation.sanitizeHtml(leadData.name),
        company: inputValidation.sanitizeHtml(leadData.company),
        niche: inputValidation.sanitizeHtml(leadData.niche),
        email: leadData.email?.toLowerCase().trim(),
        pipeline_stage: 'aguardando-inicio'
      };
      
      const { data, error } = await supabase
        .from('leads')
        .insert([sanitizedLeadData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar lead:', error);
        throw error;
      }

      console.log('Lead criado:', data);
      setLeads(prev => [data, ...prev]);
      
      // Send journey message for new lead
      await sendJourneyMessage(data.id, 'aguardando-inicio');
      
      toast({
        title: "Lead criado",
        description: "Lead foi criado com sucesso e inserido no pipeline",
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
  }, [toast, leads]);

  // Helper function to check if user needs approval
  const needsApproval = useCallback(async (action: string): Promise<boolean> => {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.user.id)
      .single();

    // Comercial users need approval for sensitive actions
    if (profile?.role === 'comercial' && ['edit_lead', 'delete_lead', 'edit_event', 'delete_event'].includes(action)) {
      return true;
    }
    
    return false;
  }, []);

  // Helper function to create pending action
  const createPendingAction = useCallback(async (type: PendingAction['type'], description: string, details: any) => {
    const { data: currentUser } = await supabase.auth.getUser();
    if (!currentUser?.user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', currentUser.user.id)
      .single();

    const newAction: PendingAction = {
      id: crypto.randomUUID(),
      type,
      description,
      user: profile?.name || 'Usuário',
      timestamp: new Date().toLocaleString('pt-BR'),
      details
    };

    setPendingActions(prev => [...prev, newAction]);
    
    toast({
      title: "Solicitação enviada",
      description: "Sua solicitação foi enviada para aprovação do supervisor",
    });
  }, [toast]);

  // Update Lead with approval check
  const updateLead = useCallback(async (id: string, leadData: Partial<Lead>) => {
    try {
      console.log('Atualizando lead:', id, leadData);
      
      // Check if needs approval
      if (await needsApproval('edit_lead')) {
        const lead = leads.find(l => l.id === id);
        if (!lead) throw new Error('Lead não encontrado');
        
        await createPendingAction(
          'edit_lead',
          `Solicitação para editar lead: ${lead.name} (${lead.company})`,
          {
            leadName: lead.name,
            changes: leadData,
            originalData: lead,
            targetId: id
          }
        );
        return;
      }
      
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
  }, [toast, leads, needsApproval, createPendingAction]);

  // Delete Lead with approval check
  const deleteLead = useCallback(async (id: string) => {
    try {
      console.log('Deletando lead:', id);
      
      // Check if needs approval
      if (await needsApproval('delete_lead')) {
        const lead = leads.find(l => l.id === id);
        if (!lead) throw new Error('Lead não encontrado');
        
        await createPendingAction(
          'delete_lead',
          `Solicitação para excluir lead: ${lead.name} (${lead.company})`,
          {
            leadName: lead.name,
            targetId: id,
            originalData: lead
          }
        );
        return;
      }
      
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
  }, [toast, leads, needsApproval, createPendingAction]);

  // Move Lead
  const moveLead = async (leadId: string, newStage: string) => {
    setActionLoading(leadId);
    try {
      const leadToMove = leads.find(lead => lead.id === leadId);
      const oldStage = leadToMove?.pipeline_stage;
      
      const { error } = await supabase
        .from('leads')
        .update({ pipeline_stage: newStage })
        .eq('id', leadId);

      if (error) throw error;

      // Rastrear a movimentação para atividades diárias
      if (oldStage && oldStage !== newStage) {
        await trackLeadMoved(oldStage, newStage);
        console.log(`Lead movido de ${oldStage} para ${newStage} - rastreamento enviado`);
      }

      // Atualizar estado local
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId 
            ? { ...lead, pipeline_stage: newStage }
            : lead
        )
      );

      // Buscar configurações e enviar webhook se configurado
      const { data: settings } = await supabase
        .from('system_settings')
        .select('journey_webhook_url')
        .single();

      if (settings?.journey_webhook_url) {
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          const webhookData = {
            lead: {
              id: lead.id,
              name: lead.name,
              company: lead.company,
              phone: lead.phone,
              email: lead.email,
              previous_stage: oldStage,
              new_stage: newStage,
              moved_at: new Date().toISOString()
            },
            system: {
              name: "Sistema CRM",
              timestamp: new Date().toISOString()
            }
          };

          try {
            await fetch(settings.journey_webhook_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookData)
            });
          } catch (webhookError) {
            console.error('Erro ao enviar webhook da jornada:', webhookError);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

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
      
      // Send agenda webhook
      try {
        const settings = localStorage.getItem('systemSettings');
        if (settings) {
          const { webhookUrl, enableImmediateSend } = JSON.parse(settings);
          if (webhookUrl && enableImmediateSend) {
            await sendWebhook(webhookUrl, {
              event_id: data.id,
              title: data.title,
              type: data.type,
              date: data.date,
              time: data.time,
              company: data.company,
              lead_name: data.lead_name,
              responsible_id: data.responsible_id,
              action: 'created',
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (webhookError) {
        console.error('Erro ao enviar webhook da agenda:', webhookError);
      }
      
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

  // Update Event with approval check
  const updateEvent = async (eventId: string, updates: any) => {
    try {
      console.log('Atualizando evento:', eventId, updates);
      
      // Check if needs approval
      if (await needsApproval('edit_event')) {
        const event = events.find(e => e.id === eventId);
        if (!event) throw new Error('Evento não encontrado');
        
        await createPendingAction(
          'edit_event',
          `Solicitação para editar evento: ${event.title}`,
          {
            eventTitle: event.title,
            changes: updates,
            originalData: event,
            targetId: eventId
          }
        );
        return;
      }

      setActionLoading(eventId);

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase ao atualizar evento:', error);
        throw error;
      }

      console.log('Evento atualizado:', data);
      setEvents(prev => prev.map(event => event.id === eventId ? data : event));
      
      toast({
        title: "Evento atualizado",
        description: "As informações do evento foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: "Erro ao atualizar evento",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Event with approval check
  const deleteEvent = useCallback(async (id: string) => {
    try {
      console.log('Deletando evento:', id);
      
      // Check if needs approval
      if (await needsApproval('delete_event')) {
        const event = events.find(e => e.id === id);
        if (!event) throw new Error('Evento não encontrado');
        
        await createPendingAction(
          'delete_event',
          `Solicitação para excluir evento: ${event.title}`,
          {
            eventTitle: event.title,
            targetId: id,
            originalData: event
          }
        );
        return;
      }
      
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
  }, [toast, events, needsApproval, createPendingAction]);

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
      
      const userId = crypto.randomUUID();
      const userWithId = { ...userData, id: userId };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([userWithId])
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
  const addPipelineStage = useCallback(async (stage: Omit<PipelineStage, 'id'>) => {
    const newStage: PipelineStage = {
      ...stage,
      id: `stage-${Date.now()}`
    };
    const newStages = [...pipelineStages, newStage];
    await savePipelineStages(newStages);
  }, [pipelineStages, savePipelineStages]);

  const updatePipelineStage = useCallback(async (id: string, stage: Partial<PipelineStage>) => {
    const newStages = pipelineStages.map(s => s.id === id ? { ...s, ...stage } : s);
    await savePipelineStages(newStages);
  }, [pipelineStages, savePipelineStages]);

  const deletePipelineStage = useCallback(async (id: string) => {
    const newStages = pipelineStages.filter(s => s.id !== id);
    await savePipelineStages(newStages);
  }, [pipelineStages, savePipelineStages]);

  // Supervision Actions with actual implementation
  const approveAction = useCallback(async (actionId: string) => {
    const action = pendingActions.find(a => a.id === actionId);
    if (!action) return;

    try {
      // Execute the approved action
      switch (action.type) {
        case 'edit_lead':
          if (action.details?.targetId && action.details?.changes) {
            const { data, error } = await supabase
              .from('leads')
              .update(action.details.changes)
              .eq('id', action.details.targetId)
              .select()
              .single();
            
            if (!error && data) {
              setLeads(prev => prev.map(lead => lead.id === action.details!.targetId ? data : lead));
            }
          }
          break;
          
        case 'delete_lead':
          if (action.details?.targetId) {
            const { error } = await supabase
              .from('leads')
              .delete()
              .eq('id', action.details.targetId);
            
            if (!error) {
              setLeads(prev => prev.filter(lead => lead.id !== action.details!.targetId));
            }
          }
          break;
          
        case 'edit_event':
          if (action.details?.targetId && action.details?.changes) {
            const { data, error } = await supabase
              .from('events')
              .update(action.details.changes)
              .eq('id', action.details.targetId)
              .select()
              .single();
            
            if (!error && data) {
              setEvents(prev => prev.map(event => event.id === action.details!.targetId ? data : event));
            }
          }
          break;
          
        case 'delete_event':
          if (action.details?.targetId) {
            const { error } = await supabase
              .from('events')
              .delete()
              .eq('id', action.details.targetId);
            
            if (!error) {
              setEvents(prev => prev.filter(event => event.id !== action.details!.targetId));
            }
          }
          break;
      }

      // Remove from pending actions
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      
      toast({
        title: "Ação aprovada",
        description: "A ação foi aprovada e executada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao executar ação aprovada:', error);
      toast({
        title: "Erro ao executar ação",
        description: "Houve um erro ao executar a ação aprovada",
        variant: "destructive",
      });
    }
  }, [toast, pendingActions]);

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
    loadPipelineStages();
  }, [loadLeads, loadEvents, loadUsers, loadPipelineStages]);

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
    loadPipelineStages,
    savePipelineStages,
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
