
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, Event, Profile, PipelineStage } from '@/types/crm';
import * as leadsService from '@/services/leadsService';
import * as eventsService from '@/services/eventsService';
import * as profilesService from '@/services/profilesService';

export function useCrmData() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Pipeline stages (kept local for now)
  const pipelineStages: PipelineStage[] = [
    { id: 'aguardando-inicio', name: 'Aguardando Início', order: 1, color: '#e11d48' },
    { id: 'primeiro-contato', name: 'Primeiro Contato', order: 2, color: '#f59e0b' },
    { id: 'reuniao', name: 'Reunião', order: 3, color: '#3b82f6' },
    { id: 'proposta-enviada', name: 'Proposta Enviada', order: 4, color: '#8b5cf6' },
    { id: 'negociacao', name: 'Negociação', order: 5, color: '#06b6d4' },
    { id: 'contrato-assinado', name: 'Contrato Assinado', order: 6, color: '#10b981' }
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchLeads(), fetchEvents(), fetchProfiles()]);
    setLoading(false);
  };

  const fetchLeads = async () => {
    try {
      const data = await leadsService.fetchLeads();
      setLeads(data);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads",
        variant: "destructive",
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await eventsService.fetchEvents();
      setEvents(data);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos",
        variant: "destructive",
      });
    }
  };

  const fetchProfiles = async () => {
    try {
      const data = await profilesService.fetchProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    }
  };

  return {
    leads,
    events,
    profiles,
    pipelineStages,
    loading,
    fetchLeads,
    fetchEvents,
    fetchProfiles,
    loadData
  };
}
