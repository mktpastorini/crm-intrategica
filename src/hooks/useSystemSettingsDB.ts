
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SystemSettings } from '@/types/settings';
import { useToast } from '@/hooks/use-toast';

const defaultSettings: SystemSettings = {
  systemName: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#1d0029',
  secondaryColor: '',
  webhookUrl: '',
  messageWebhookUrl: '',
  journeyWebhookUrl: '',
  dbUrl: '',
  dbAnonKey: '',
  dbServiceRoleKey: '',
  dbHost: '',
  dbPort: '',
  dbName: '',
  dbUser: '',
  dbPassword: ''
};

export function useSystemSettingsDB() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      console.log('Carregando configurações do sistema...');
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        console.log('Configurações carregadas:', data);
        setSettings({
          id: data.id,
          systemName: data.system_name || '',
          logoUrl: data.logo_url || '',
          faviconUrl: data.favicon_url || '',
          primaryColor: data.primary_color || '#1d0029',
          secondaryColor: data.secondary_color || '',
          webhookUrl: data.webhook_url || '',
          messageWebhookUrl: data.message_webhook_url || '',
          journeyWebhookUrl: data.journey_webhook_url || '',
          dbUrl: '',
          dbAnonKey: '',
          dbServiceRoleKey: '',
          dbHost: '',
          dbPort: '',
          dbName: '',
          dbUser: '',
          dbPassword: ''
        });
      } else {
        console.log('Nenhuma configuração encontrada, usando padrões');
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    try {
      console.log('Atualizando configurações:', updates);
      
      const dbUpdates: any = {};
      if ('systemName' in updates) dbUpdates.system_name = updates.systemName;
      if ('logoUrl' in updates) dbUpdates.logo_url = updates.logoUrl;
      if ('faviconUrl' in updates) dbUpdates.favicon_url = updates.faviconUrl;
      if ('primaryColor' in updates) dbUpdates.primary_color = updates.primaryColor;
      if ('secondaryColor' in updates) dbUpdates.secondary_color = updates.secondaryColor;
      if ('webhookUrl' in updates) dbUpdates.webhook_url = updates.webhookUrl;
      if ('messageWebhookUrl' in updates) dbUpdates.message_webhook_url = updates.messageWebhookUrl;
      if ('journeyWebhookUrl' in updates) dbUpdates.journey_webhook_url = updates.journeyWebhookUrl;

      let result;
      
      if (settings.id) {
        // Atualizar registro existente
        result = await supabase
          .from('system_settings')
          .update(dbUpdates)
          .eq('id', settings.id)
          .select()
          .single();
      } else {
        // Criar novo registro
        result = await supabase
          .from('system_settings')
          .insert([dbUpdates])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Erro ao salvar configurações:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('Configurações salvas com sucesso:', result.data);
      
      // Atualizar estado local
      setSettings(prev => ({ ...prev, ...updates, id: result.data.id }));
      
      toast({
        title: "Configurações salvas",
        description: "As configurações foram salvas com sucesso",
      });

      return { success: true, data: result.data };
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar as configurações",
        variant: "destructive",
      });

      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    updateSettings,
    loading,
    reload: loadSettings
  };
}
