
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types/crm';

export const fetchEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      responsible:responsible_id (
        name,
        email
      )
    `)
    .order('date', { ascending: true });

  if (error) throw error;

  return data?.map(event => ({
    id: event.id,
    title: event.title,
    leadName: event.lead_name,
    company: event.company,
    date: event.date,
    time: event.time,
    responsible_id: event.responsible_id,
    responsible: event.responsible,
    type: event.type as 'reunion' | 'call' | 'whatsapp' | 'email',
    leadId: event.lead_id
  })) || [];
};

export const addEvent = async (eventData: Omit<Event, 'id'>) => {
  const { error } = await supabase
    .from('events')
    .insert({
      title: eventData.title,
      lead_name: eventData.leadName,
      company: eventData.company,
      date: eventData.date,
      time: eventData.time,
      responsible_id: eventData.responsible_id,
      type: eventData.type,
      lead_id: eventData.leadId
    });

  if (error) throw error;
};

export const updateEvent = async (id: string, updates: Partial<Event>) => {
  const { error } = await supabase
    .from('events')
    .update({
      title: updates.title,
      lead_name: updates.leadName,
      company: updates.company,
      date: updates.date,
      time: updates.time,
      responsible_id: updates.responsible_id,
      type: updates.type,
      lead_id: updates.leadId
    })
    .eq('id', id);

  if (error) throw error;
};

export const deleteEvent = async (id: string) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
