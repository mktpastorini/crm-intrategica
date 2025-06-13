
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useDailyActivityTracker() {
  const trackLeadAdded = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar atividade diária:', error);
        return;
      }

      if (data) {
        // Atualizar registro existente
        await supabase
          .from('daily_activities')
          .update({ 
            leads_added: (data.leads_added || 0) + 1 
          })
          .eq('id', data.id);
      } else {
        // Criar novo registro
        await supabase
          .from('daily_activities')
          .insert([{
            date: today,
            leads_added: 1,
            leads_moved: {},
            messages_sent: 0,
            events_created: 0
          }]);
      }
    } catch (error) {
      console.error('Erro ao rastrear lead adicionado:', error);
    }
  }, []);

  const trackLeadMoved = useCallback(async (fromStage: string, toStage: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar atividade diária:', error);
        return;
      }

      const currentLeadsMoved = data?.leads_moved || {};
      const updatedLeadsMoved = {
        ...currentLeadsMoved,
        [toStage]: (currentLeadsMoved[toStage] || 0) + 1
      };

      if (data) {
        // Atualizar registro existente
        await supabase
          .from('daily_activities')
          .update({ 
            leads_moved: updatedLeadsMoved
          })
          .eq('id', data.id);
      } else {
        // Criar novo registro
        await supabase
          .from('daily_activities')
          .insert([{
            date: today,
            leads_added: 0,
            leads_moved: updatedLeadsMoved,
            messages_sent: 0,
            events_created: 0
          }]);
      }
    } catch (error) {
      console.error('Erro ao rastrear movimento de lead:', error);
    }
  }, []);

  const trackMessageSent = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar atividade diária:', error);
        return;
      }

      if (data) {
        // Atualizar registro existente
        await supabase
          .from('daily_activities')
          .update({ 
            messages_sent: (data.messages_sent || 0) + 1 
          })
          .eq('id', data.id);
      } else {
        // Criar novo registro
        await supabase
          .from('daily_activities')
          .insert([{
            date: today,
            leads_added: 0,
            leads_moved: {},
            messages_sent: 1,
            events_created: 0
          }]);
      }
    } catch (error) {
      console.error('Erro ao rastrear mensagem enviada:', error);
    }
  }, []);

  const trackEventCreated = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar atividade diária:', error);
        return;
      }

      if (data) {
        // Atualizar registro existente
        await supabase
          .from('daily_activities')
          .update({ 
            events_created: (data.events_created || 0) + 1 
          })
          .eq('id', data.id);
      } else {
        // Criar novo registro
        await supabase
          .from('daily_activities')
          .insert([{
            date: today,
            leads_added: 0,
            leads_moved: {},
            messages_sent: 0,
            events_created: 1
          }]);
      }
    } catch (error) {
      console.error('Erro ao rastrear evento criado:', error);
    }
  }, []);

  return {
    trackLeadAdded,
    trackLeadMoved,
    trackMessageSent,
    trackEventCreated
  };
}
