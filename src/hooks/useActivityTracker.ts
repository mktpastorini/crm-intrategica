import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useActivityTracker() {
  useEffect(() => {
    // Função para atualizar atividades diárias
    const updateDailyActivity = async (type: 'leads_added' | 'events_created' | 'events_completed', data?: any) => {
      const today = new Date().toISOString().split('T')[0];
      
      try {
        // Buscar registro do dia atual
        const { data: existing, error: fetchError } = await supabase
          .from('daily_activities')
          .select('*')
          .eq('date', today)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Erro ao buscar atividades diárias:', fetchError);
          return;
        }

        let updateData: any = {};
        
        if (type === 'leads_added') {
          updateData.leads_added = (existing?.leads_added || 0) + 1;
        } else if (type === 'events_created') {
          updateData.events_created = (existing?.events_created || 0) + 1;
        } else if (type === 'events_completed' && data?.previousStage && data?.newStage) {
          // Rastrear apenas estágios que receberam leads (destino)
          const currentMoved = existing?.leads_moved || {};
          const safeCurrentMoved = typeof currentMoved === 'object' && currentMoved !== null ? currentMoved : {};
          const destinationStage = data.newStage;
          updateData.leads_moved = {
            ...safeCurrentMoved,
            [destinationStage]: (safeCurrentMoved[destinationStage] || 0) + 1
          };
        }

        if (existing) {
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from('daily_activities')
            .update(updateData)
            .eq('id', existing.id);
            
          if (updateError) {
            console.error('Erro ao atualizar atividades diárias:', updateError);
          }
        } else {
          // Criar novo registro
          const { error: insertError } = await supabase
            .from('daily_activities')
            .insert([{ date: today, ...updateData }]);
            
          if (insertError) {
            console.error('Erro ao inserir atividades diárias:', insertError);
          }
        }
      } catch (error) {
        console.error('Erro no rastreamento de atividades:', error);
      }
    };

    // Listener para novos leads
    const leadsSubscription = supabase
      .channel('leads_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'leads' },
        () => {
          console.log('Novo lead adicionado, atualizando estatísticas...');
          updateDailyActivity('leads_added');
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;
          
          // Verificar se houve mudança de estágio
          if (oldRecord.pipeline_stage !== newRecord.pipeline_stage) {
            console.log('Lead movido entre estágios:', oldRecord.pipeline_stage, '->', newRecord.pipeline_stage);
            updateDailyActivity('events_completed', {
              previousStage: oldRecord.pipeline_stage,
              newStage: newRecord.pipeline_stage
            });
          }
        }
      )
      .subscribe();

    // Listener para novos eventos
    const eventsSubscription = supabase
      .channel('events_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        () => {
          console.log('Novo evento criado, atualizando estatísticas...');
          updateDailyActivity('events_created');
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;
          
          // Verificar se o evento foi marcado como concluído
          if (!oldRecord.completed && newRecord.completed) {
            console.log('Evento marcado como concluído');
            // Pode adicionar lógica específica para eventos concluídos se necessário
          }
        }
      )
      .subscribe();

    return () => {
      leadsSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
    };
  }, []);
}
