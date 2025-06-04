import { createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Lead, Event, Profile, PipelineStage, PendingAction } from '@/types/crm';
import { useCrmData } from '@/hooks/useCrmData';
import * as leadsService from '@/services/leadsService';
import * as eventsService from '@/services/eventsService';
import * as profilesService from '@/services/profilesService';

interface CrmContextType {
  leads: Lead[];
  profiles: Profile[];
  pipelineStages: PipelineStage[];
  events: Event[];
  pendingActions: PendingAction[];
  loading: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  moveLead: (leadId: string, newStage: string) => Promise<void>;
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addProfile: (profile: Omit<Profile, 'id' | 'created_at'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  fetchProfiles: () => Promise<void>;
  approveAction: (actionId: string) => void;
  rejectAction: (actionId: string) => void;
  requestLeadEdit: (leadId: string, updates: Partial<Lead>, user: string) => void;
  requestLeadDelete: (leadId: string, user: string) => void;
  addPipelineStage: (stage: PipelineStage) => void;
  updatePipelineStage: (id: string, updates: Partial<PipelineStage>) => void;
  deletePipelineStage: (id: string) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { leads, events, profiles, pipelineStages, loading, fetchLeads, fetchEvents, fetchProfiles } = useCrmData();

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    try {
      await leadsService.addLead(leadData);
      await fetchLeads();
      toast({
        title: "Lead adicionado",
        description: "Lead foi adicionado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o lead",
        variant: "destructive",
      });
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      await leadsService.updateLead(id, updates);
      await fetchLeads();
      toast({
        title: "Lead atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lead",
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await leadsService.deleteLead(id);
      await fetchLeads();
      await fetchEvents();
      toast({
        title: "Lead removido",
        description: "Lead foi removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o lead",
        variant: "destructive",
      });
    }
  };

  const moveLead = async (leadId: string, newStage: string) => {
    try {
      await leadsService.moveLead(leadId, newStage);
      await fetchLeads();
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível mover o lead",
        variant: "destructive",
      });
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      await eventsService.addEvent(eventData);
      await fetchEvents();
      toast({
        title: "Evento adicionado",
        description: "Evento foi agendado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o evento",
        variant: "destructive",
      });
    }
  };

  const updateEvent = async (id: string, updates: Partial<Event>) => {
    try {
      await eventsService.updateEvent(id, updates);
      await fetchEvents();
      toast({
        title: "Evento atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o evento",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await eventsService.deleteEvent(id);
      await fetchEvents();
      toast({
        title: "Evento removido",
        description: "Evento foi removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover evento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o evento",
        variant: "destructive",
      });
    }
  };

  const addProfile = async (profileData: Omit<Profile, 'id' | 'created_at'>) => {
    try {
      await profilesService.addProfile(profileData);
      await fetchProfiles();
      toast({
        title: "Usuário adicionado",
        description: "Usuário foi criado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o usuário",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    try {
      await profilesService.updateProfile(id, updates);
      await fetchProfiles();
      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário",
        variant: "destructive",
      });
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await profilesService.deleteProfile(id);
      await fetchProfiles();
      toast({
        title: "Usuário removido",
        description: "Usuário foi removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário",
        variant: "destructive",
      });
    }
  };

  // Placeholder implementations for pending actions (local functionality)
  const pendingActions: PendingAction[] = [];
  const addPipelineStage = (stage: PipelineStage) => {};
  const updatePipelineStage = (id: string, updates: Partial<PipelineStage>) => {};
  const deletePipelineStage = (id: string) => {};
  const requestLeadEdit = (leadId: string, updates: Partial<Lead>, user: string) => {};
  const requestLeadDelete = (leadId: string, user: string) => {};
  const approveAction = (actionId: string) => {};
  const rejectAction = (actionId: string) => {};

  return (
    <CrmContext.Provider value={{
      leads,
      profiles,
      pipelineStages,
      events,
      pendingActions,
      loading,
      addLead,
      updateLead,
      deleteLead,
      moveLead,
      addEvent,
      updateEvent,
      deleteEvent,
      addProfile,
      updateProfile,
      deleteProfile,
      fetchProfiles,
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
