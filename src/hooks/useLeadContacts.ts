
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LeadContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  position?: string;
}

export function useLeadContacts(leadId?: string) {
  const [contacts, setContacts] = useState<LeadContact[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadContacts = async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_contacts')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setContacts(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contatos do lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveContacts = async (leadId: string, contactsToSave: LeadContact[]) => {
    if (!leadId) return;

    try {
      // Primeiro, excluir todos os contatos existentes
      const { error: deleteError } = await supabase
        .from('lead_contacts')
        .delete()
        .eq('lead_id', leadId);

      if (deleteError) throw deleteError;

      // Então, inserir os novos contatos (se houver)
      if (contactsToSave.length > 0) {
        const contactsToInsert = contactsToSave.map(contact => ({
          lead_id: leadId,
          name: contact.name,
          phone: contact.phone,
          email: contact.email || null,
          position: contact.position || null,
        }));

        const { error: insertError } = await supabase
          .from('lead_contacts')
          .insert(contactsToInsert);

        if (insertError) throw insertError;
      }

      // Recarregar os contatos após salvar
      await loadContacts(leadId);
    } catch (error) {
      console.error('Erro ao salvar contatos:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar contatos do lead",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (leadId) {
      loadContacts(leadId);
    }
  }, [leadId]);

  return {
    contacts,
    loading,
    setContacts,
    saveContacts,
    loadContacts,
  };
}
