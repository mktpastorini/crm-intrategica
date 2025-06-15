import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { createJourneySchedule } from "@/utils/journeyScheduleService";

// Use the Lead interface from database - company is required in database
interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company: string; // Required field in database
  title?: string;
  source?: string;
  owner_id?: string;
  pipeline_stage?: string;
  status: string; // Required field - make consistent with database
  priority?: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
  responsible_id: string;
  niche: string;
  address?: string;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  place_id?: string;
  rating?: number;
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
  type: string;
  date: string;
  time: string;
  company?: string;
  lead_name?: string;
  responsible_id: string;
  completed?: boolean;
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
  details: any;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id?: string;
  user?: any;
  timestamp?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  status: string;
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

interface ProductService {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: 'product' | 'service';
  created_at: string;
  updated_at: string;
}

interface Proposal {
  id: string;
  title: string;
  content: string;
  total_value: number;
  lead_id?: string;
  created_at: string;
  updated_at: string;
}

interface ProposalItem {
  id: string;
  proposal_id: string;
  product_service_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

interface CrmContextType {
  leads: Lead[];
  events: Event[];
  pipelineStages: PipelineStage[];
  categories: Category[];
  pendingActions: PendingAction[];
  users: User[];
  loading: boolean;
  actionLoading: string | null;
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLead: (leadId: string, newStage: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  createEvent: (event: any) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addPipelineStage: (stage: Omit<PipelineStage, 'id'>) => Promise<void>;
  updatePipelineStage: (id: string, updates: Partial<PipelineStage>) => Promise<void>;
  deletePipelineStage: (id: string) => Promise<void>;
  savePipelineStages: (stages: PipelineStage[]) => Promise<void>;
  sendBulkMessage: (leadIds: string[], message: string) => Promise<void>;
  requestAction: (action: Omit<PendingAction, 'id' | 'created_at'>) => Promise<void>;
  approveAction: (actionId: string) => Promise<void>;
  rejectAction: (actionId: string) => Promise<void>;
  loadPendingActions: () => Promise<void>;
  loadLeads: () => Promise<void>;
  loadEvents: () => Promise<void>;
  loadUsers: () => Promise<void>;
  productsServices: ProductService[];
  proposals: Proposal[];
  addProductService: (item: Omit<ProductService, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProductService: (id: string, updates: Partial<ProductService>) => Promise<void>;
  deleteProductService: (id: string) => Promise<void>;
  addProposal: (proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  loadProductsServices: () => Promise<void>;
  loadProposals: () => Promise<void>;
  linkProposalToLead: (leadId: string, proposalId: string) => Promise<void>;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

async function testDbConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (err) {
    return false;
  }
}

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { settings } = useSystemSettingsDB();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Marketing', description: 'Leads vindos de ações de marketing' },
    { id: '2', name: 'Indicação', description: 'Leads indicados por clientes' },
    { id: '3', name: 'Outros', description: 'Outras fontes de leads' },
  ]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [productsServices, setProductsServices] = useState<ProductService[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  // Função para carregar estágios do pipeline do banco de dados
  const loadPipelineStages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('Erro ao carregar pipeline_stages:', error);
        throw error;
      }

      if (data) {
        setPipelineStages(data as PipelineStage[]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar pipeline_stages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estágios do pipeline!",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função utilitária para comparar estágios ignorando diferenças (caso, acentuação, etc)
  const stagesEqual = (a: string, b: string) => {
    if (!a || !b) return false;
    return a.toLocaleLowerCase('pt-BR').normalize("NFD").replace(/[\u0300-\u036f]/g, "") ===
           b.toLocaleLowerCase('pt-BR').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  // Journey message trigger functions
  const persistJourneyMessageSchedule = async (
    leadId: string,
    message: JourneyMessage,
    leadData: any
  ) => {
    if (!settings.journeyWebhookUrl) {
      console.log("Webhook da jornada não configurado.");
      return;
    }

    let delayMs = 0;
    switch (message.delayUnit) {
      case "minutes":
        delayMs = message.delay * 60 * 1000;
        break;
      case "hours":
        delayMs = message.delay * 60 * 60 * 1000;
        break;
      case "days":
        delayMs = message.delay * 24 * 60 * 60 * 1000;
        break;
    }

    // Data/hora de disparo
    const scheduledFor = new Date(Date.now() + delayMs).toISOString();

    try {
      await createJourneySchedule({
        lead_id: leadId,
        lead_name: leadData.name,
        lead_email: leadData.email,
        lead_phone: leadData.phone,
        stage: message.stage,
        message_title: message.title,
        message_content: message.content,
        message_type: message.type,
        media_url: message.mediaUrl,
        scheduled_for: scheduledFor,
        webhook_url: settings.journeyWebhookUrl,
      });
      console.log(
        `[Jornada] Agendamento criado para lead ${leadData.name} às ${scheduledFor}`
      );
    } catch (error: any) {
      toast({
        title: "Erro ao agendar mensagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const triggerJourneyMessages = (
    leadId: string,
    newStage: string,
    leadData: any
  ) => {
    const savedMessages = localStorage.getItem("journeyMessages");
    if (!savedMessages) {
      console.log("[Jornada] Nenhuma mensagem de jornada configurada.");
      return;
    }

    const messages: JourneyMessage[] = JSON.parse(savedMessages);
    const stageMessages = messages
      .filter((m) => stagesEqual(m.stage, newStage))
      .sort((a, b) => a.order - b.order);

    console.log(
      `[Jornada] Encontradas ${stageMessages.length} mensagens para o lead ${leadId} no estágio "${newStage}"`
    );
    if (stageMessages.length === 0) {
      console.log(
        `[Jornada] Nenhuma mensagem cadastrada para o estágio ${newStage}.`
      );
    }

    stageMessages.forEach((message) => {
      persistJourneyMessageSchedule(leadId, message, leadData);
    });
  };

  // Carregar dados automaticamente quando o componente for montado
  useEffect(() => {
    console.log('Iniciando carregamento dos dados do banco...');
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadLeads(),
          loadEvents(),
          loadUsers(),
          loadPendingActions(),
          loadPipelineStages(),
          loadProductsServices(),
          loadProposals()
        ]);
        console.log('Todos os dados foram carregados com sucesso');
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do sistema",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await testDbConnection();
      if (!ok) {
        toast({
          title: "Erro de conexão",
          description: "Não foi possível conectar ao banco de dados Supabase. Verifique sua conexão e as configurações.",
          variant: "destructive",
        });
      }
    })();
  }, []); // Apenas uma vez ao montar

  const loadUsers = async () => {
    try {
      console.log('Carregando usuários do banco...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        throw error;
      }
      
      if (data) {
        console.log(`${data.length} usuários carregados:`, data);
        setUsers(data as User[]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    }
  };

  const loadLeads = async () => {
    try {
      console.log('Carregando leads do banco...');
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao carregar leads:', error);
        throw error;
      }
      let validLeads: Lead[] = [];
      if (data) {
        console.log(`${data.length} leads carregados:`, data);

        // Obtenha estágios válidos a partir do estado atual
        const pipelineStagesSnapshot = pipelineStages.length > 0 ? pipelineStages : await supabase.from('pipeline_stages').select('*').then(r => r.data || []);
        const validStageIds = pipelineStagesSnapshot.map(s => s.id);
        const primeiroStageId = getPrimeiroStageId(pipelineStagesSnapshot);

        // Trate os leads com estágio inválido
        const leadsToFix = data.filter((lead: Lead) => !validStageIds.includes(lead.pipeline_stage));
        if (leadsToFix.length > 0 && primeiroStageId) {
          console.log(`Corrigindo ${leadsToFix.length} leads de estágio inválido para '${primeiroStageId}'`);
          await Promise.all(
            leadsToFix.map(async (lead: Lead) => {
              await supabase.from('leads').update({ pipeline_stage: primeiroStageId }).eq('id', lead.id);
            })
          );
          // Refaz o load após a atualização
          const { data: fixedLeadsData } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });
          validLeads = fixedLeadsData as Lead[];
        } else {
          validLeads = data as Lead[];
        }
        setLeads(validLeads);
      }
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
      console.log('Carregando eventos do banco...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Erro ao carregar eventos:', error);
        throw error;
      }
      
      if (data) {
        console.log(`${data.length} eventos carregados:`, data);
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
          updated_at: event.created_at,
          type: event.type,
          date: event.date,
          time: event.time,
          company: event.company,
          lead_name: event.lead_name,
          responsible_id: event.responsible_id,
          completed: event.completed
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

  const loadPendingActions = async () => {
    try {
      console.log('Carregando ações pendentes do banco...');
      const { data, error } = await supabase
        .from('pending_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar ações pendentes:', error);
        throw error;
      }
      
      if (data) {
        console.log(`${data.length} ações pendentes carregadas:`, data);
        const transformedActions: PendingAction[] = data.map(action => ({
          ...action,
          status: action.status as 'pending' | 'approved' | 'rejected',
          user: users.find(u => u.id === action.user_id),
          timestamp: action.created_at
        }));
        setPendingActions(transformedActions);
      }
    } catch (error: any) {
      console.error('Erro ao carregar solicitações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações",
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
        details: { leadId: id, leadName: leads.find(l => l.id === id)?.name },
        status: 'pending',
        user_id: user?.id || ''
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
        details: { leadId: id, leadName: leads.find(l => l.id === id)?.name, changes: updates },
        status: 'pending',
        user_id: user?.id || ''
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
        const oldLead = leads.find(l => l.id === id);
        if (oldLead && updates.pipeline_stage && oldLead.pipeline_stage !== updates.pipeline_stage) {
          console.log(`Lead ${id} mudou do estágio ${oldLead.pipeline_stage} para ${updates.pipeline_stage}`);
          triggerJourneyMessages(id, updates.pipeline_stage, data);
        }

        setLeads(prev => prev.map(lead => lead.id === id ? data as Lead : lead));
        
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

  const moveLead = async (leadId: string, newStage: string) => {
    await updateLead(leadId, { pipeline_stage: newStage });
  };

  // Função utilitária: retorna o id do 1º estágio ('aguardando_contato')
  const getPrimeiroStageId = (pipelineStages: PipelineStage[]) => {
    return pipelineStages.find(s => s.id === "aguardando_contato")?.id || pipelineStages[0]?.id;
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setActionLoading('create-lead');
      // Pega o estágio "Aguardando Início" 
      let primeiroStageId = 'aguardando_contato';
      // Se pipelineStages não está vazio, busca pelo id mesmo que o nome mude
      if (pipelineStages.length > 0) {
        primeiroStageId = getPrimeiroStageId(pipelineStages) || 'aguardando_contato';
      }

      const leadToInsert = {
        ...leadData,
        pipeline_stage: primeiroStageId,
        responsible_id: leadData.responsible_id || user?.id || '',
        niche: leadData.niche || 'Geral',
        company: leadData.company || 'Não informado',
        name: leadData.name || 'Lead sem nome',
        phone: leadData.phone || '',
        status: leadData.status || 'novo'
      };
      console.log('Criando novo lead:', leadToInsert);

      const { data, error } = await supabase
        .from('leads')
        .insert([leadToInsert])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setLeads(prev => [...prev, data as Lead]);
        if (data.pipeline_stage) {
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
    } finally {
      setActionLoading(null);
    }
  };

  const createLead = addLead;

  const addEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setActionLoading('create-event');
      const dbEventData = {
        title: eventData.title,
        lead_name: eventData.description || eventData.lead_name || '',
        date: eventData.start_time ? eventData.start_time.split('T')[0] : eventData.date,
        time: eventData.start_time ? eventData.start_time.split('T')[1] : eventData.time,
        company: eventData.location || eventData.company || '',
        lead_id: eventData.lead_id || null,
        responsible_id: eventData.user_id || eventData.responsible_id || user?.id || '',
        type: eventData.type || 'meeting'
      };

      console.log('Criando novo evento:', dbEventData);

      const { data, error } = await supabase
        .from('events')
        .insert([dbEventData])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        console.log('Evento criado com sucesso:', data);
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
          updated_at: data.created_at,
          type: data.type,
          date: data.date,
          time: data.time,
          company: data.company,
          lead_name: data.lead_name,
          responsible_id: data.responsible_id,
          completed: data.completed
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
    } finally {
      setActionLoading(null);
    }
  };

  const createEvent = addEvent;

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      setActionLoading(id);
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description) dbUpdates.lead_name = updates.description;
      if (updates.location) dbUpdates.company = updates.location;
      if (updates.lead_id !== undefined) dbUpdates.lead_id = updates.lead_id;
      if (updates.user_id) dbUpdates.responsible_id = updates.user_id;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
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
          updated_at: data.created_at,
          type: data.type,
          date: data.date,
          time: data.time,
          company: data.company,
          lead_name: data.lead_name,
          responsible_id: data.responsible_id,
          completed: data.completed
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
    } finally {
      setActionLoading(null);
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

  const addPipelineStage = async (stage: Omit<PipelineStage, 'id'>) => {
    try {
      setActionLoading('create-pipeline-stage');
      const newId = `${stage.name.toLowerCase().replace(/\s/g, '_')}`;
      const newStage = { ...stage, id: newId };

      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert([newStage])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPipelineStages(prev => [...prev, data as PipelineStage]);
        toast({
          title: "Estágio criado",
          description: "Estágio foi criado com sucesso e salvo no banco",
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar estágio:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar estágio do pipeline!",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updatePipelineStage = async (id: string, updates: Partial<PipelineStage>) => {
    try {
      setActionLoading(`update-pipeline-stage-${id}`);
      const { data, error } = await supabase
        .from('pipeline_stages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPipelineStages(prev => prev.map(stage => stage.id === id ? data as PipelineStage : stage));
        toast({
          title: "Estágio atualizado",
          description: "Estágio do pipeline salvo no banco",
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar estágio:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar estágio do pipeline!",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deletePipelineStage = async (id: string) => {
    try {
      setActionLoading(`delete-pipeline-stage-${id}`);
      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setPipelineStages(prev => prev.filter(stage => stage.id !== id));
      toast({
        title: "Estágio removido",
        description: "Estágio do pipeline removido do banco e interface",
      });
    } catch (error: any) {
      console.error('Erro ao remover estágio:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover estágio do pipeline!",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const savePipelineStages = async (stages: PipelineStage[]) => {
    try {
      setActionLoading('save-pipeline-stages');
      // Atualiza ordem em lote. Para trocar ordem, só muda o campo "order".
      const updates = await Promise.all(
        stages.map(async (stage) => {
          const { data, error } = await supabase
            .from('pipeline_stages')
            .update({ order: stage.order, updated_at: new Date().toISOString() })
            .eq('id', stage.id)
            .select()
            .single();
          if (error) throw error;
          return data;
        })
      );
      setPipelineStages(updates.filter(Boolean) as PipelineStage[]);
      toast({
        title: "Estágios salvos",
        description: "A ordem dos estágios foi salva no banco!",
      });
    } catch (error: any) {
      console.error('Erro ao salvar ordem de estágios:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar ordem dos estágios do pipeline",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const sendBulkMessage = async (leadIds: string[], message: string) => {
    try {
      console.log('Enviando mensagens em massa para:', leadIds.length, 'leads');
      
      toast({
        title: "Mensagens enviadas",
        description: `${leadIds.length} mensagens enviadas com sucesso`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar mensagens em massa:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagens em massa",
        variant: "destructive",
      });
    }
  };

  const requestAction = async (action: Omit<PendingAction, 'id' | 'created_at'>) => {
    try {
      const actionToInsert = {
        ...action,
        status: 'pending' as const,
        user_id: action.user_id || user?.id || '',
        details: action.details
      };

      console.log('Solicitando ação:', actionToInsert);

      const { data, error } = await supabase
        .from('pending_approvals')
        .insert([actionToInsert])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const transformedAction: PendingAction = {
          ...data,
          status: data.status as 'pending' | 'approved' | 'rejected',
          user: users.find(u => u.id === data.user_id),
          timestamp: data.created_at
        };
        setPendingActions(prev => [...prev, transformedAction]);
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
    setActionLoading(actionId);
    const ok = await testDbConnection();
    if (!ok) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao banco de dados. Tente novamente!",
        variant: "destructive",
      });
      setActionLoading(null);
      return;
    }
    try {
      const action = pendingActions.find(a => a.id === actionId);
      if (!action) throw new Error('Ação não encontrada');

      const actionDetails = action.details as any;

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
          setLeads(prev => prev.map(lead => lead.id === actionDetails.leadId ? data as Lead : lead));
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
            updated_at: data.created_at,
            type: data.type,
            date: data.date,
            time: data.time,
            company: data.company,
            lead_name: data.lead_name,
            responsible_id: data.responsible_id,
            completed: data.completed
          };
          setEvents(prev => prev.map(event => event.id === actionDetails.eventId ? transformedEvent : event));
        }
      }

      const { error: updateError } = await supabase
        .from('pending_approvals')
        .update({ status: 'approved' })
        .eq('id', actionId);

      if (updateError) throw updateError;

      setPendingActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'approved' as const } : a));

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
    } finally {
      setActionLoading(null);
      await loadPendingActions(); // Sempre recarregar após ação
    }
  };

  const rejectAction = async (actionId: string) => {
    setActionLoading(actionId);
    const ok = await testDbConnection();
    if (!ok) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao banco de dados. Tente novamente!",
        variant: "destructive",
      });
      setActionLoading(null);
      return;
    }
    try {
      const { error } = await supabase
        .from('pending_approvals')
        .update({ status: 'rejected' })
        .eq('id', actionId);

      if (error) {
        throw error;
      }
      setPendingActions(prev => prev.map(a => a.id === actionId ? { ...a, status: 'rejected' as const } : a));
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
    } finally {
      setActionLoading(null);
      await loadPendingActions(); // Sempre recarrega
    }
  };

  const addProductService = async (item: Omit<ProductService, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setActionLoading('create-product-service');
      console.log('Criando produto/serviço:', item);

      const { data, error } = await supabase
        .from('products_services')
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProductsServices(prev => [...prev, data as ProductService]);
        toast({
          title: "Produto/Serviço criado",
          description: "Item foi criado com sucesso",
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar produto/serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar produto/serviço",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateProductService = async (id: string, updates: Partial<ProductService>) => {
    try {
      const { data, error } = await supabase
        .from('products_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProductsServices(prev => prev.map(item => item.id === id ? data as ProductService : item));
        toast({
          title: "Produto/Serviço atualizado",
          description: "Item foi atualizado com sucesso",
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar produto/serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto/serviço",
        variant: "destructive",
      });
    }
  };

  const deleteProductService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProductsServices(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Produto/Serviço excluído",
        description: "Item foi excluído com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir produto/serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir produto/serviço",
        variant: "destructive",
      });
    }
  };

  const addProposal = async (proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setActionLoading('create-proposal');
      console.log('Criando proposta:', proposal);

      const { data, error } = await supabase
        .from('proposals')
        .insert([proposal])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProposals(prev => [...prev, data as Proposal]);
        toast({
          title: "Proposta criada",
          description: "Proposta foi criada com sucesso",
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar proposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar proposta",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateProposal = async (id: string, updates: Partial<Proposal>) => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProposals(prev => prev.map(prop => prop.id === id ? data as Proposal : prop));
        toast({
          title: "Proposta atualizada",
          description: "Proposta foi atualizada com sucesso",
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar proposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar proposta",
        variant: "destructive",
      });
    }
  };

  const deleteProposal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProposals(prev => prev.filter(prop => prop.id !== id));
      toast({
        title: "Proposta excluída",
        description: "Proposta foi excluída com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao excluir proposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir proposta",
        variant: "destructive",
      });
    }
  };

  const linkProposalToLead = async (leadId: string, proposalId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ proposal_id: proposalId })
        .eq('id', leadId);

      if (error) throw error;

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, proposal_id: proposalId } : lead
      ));

      toast({
        title: "Proposta vinculada",
        description: "Proposta foi vinculada ao lead com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao vincular proposta ao lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao vincular proposta ao lead",
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
      users,
      loading,
      actionLoading,
      addLead,
      createLead,
      updateLead,
      deleteLead,
      moveLead,
      addEvent,
      createEvent,
      updateEvent,
      deleteEvent,
      addCategory,
      updateCategory,
      deleteCategory,
      addPipelineStage,
      updatePipelineStage,
      deletePipelineStage,
      savePipelineStages,
      sendBulkMessage,
      requestAction,
      approveAction,
      rejectAction,
      loadPendingActions,
      loadLeads,
      loadEvents,
      loadUsers,
      productsServices,
      proposals,
      addProductService,
      updateProductService,
      deleteProductService,
      addProposal,
      updateProposal,
      deleteProposal,
      loadProductsServices,
      loadProposals,
      linkProposalToLead,
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
