
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemSettings {
  id?: string;
  systemName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  webhookUrl: string;
  messageWebhookUrl: string;
  journeyWebhookUrl: string;
}

const defaultSettings: SystemSettings = {
  systemName: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#1d0029',
  secondaryColor: '#8b5cf6',
  webhookUrl: '',
  messageWebhookUrl: '',
  journeyWebhookUrl: ''
};

export function useSystemSettingsDB() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        const loadedSettings = {
          id: data.id,
          systemName: data.system_name || '',
          logoUrl: data.logo_url || '',
          faviconUrl: data.favicon_url || '',
          primaryColor: data.primary_color || '#1d0029',
          secondaryColor: data.secondary_color || '#8b5cf6',
          webhookUrl: data.webhook_url || '',
          messageWebhookUrl: data.message_webhook_url || '',
          journeyWebhookUrl: data.journey_webhook_url || ''
        };
        setSettings(loadedSettings);
        applyVisualSettings(loadedSettings);
      } else {
        applyVisualSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      applyVisualSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const applyVisualSettings = (settings: Partial<SystemSettings>) => {
    try {
      // Apply logo
      if (settings.logoUrl) {
        const logoElements = document.querySelectorAll('[data-logo]');
        logoElements.forEach(element => {
          if (element instanceof HTMLImageElement) {
            element.src = settings.logoUrl;
          }
        });
      }
      
      // Apply favicon
      if (settings.faviconUrl) {
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = settings.faviconUrl;
      }
      
      // Apply system name to title only if it exists
      if (settings.systemName) {
        document.title = settings.systemName;
      } else {
        document.title = 'CRM'; // Default title when no system name is set
      }
      
      // Apply colors
      const root = document.documentElement;
      if (settings.primaryColor) {
        root.style.setProperty('--primary-color', settings.primaryColor);
      }
      if (settings.secondaryColor) {
        root.style.setProperty('--secondary-color', settings.secondaryColor);
      }
    } catch (error) {
      console.error('Error applying visual settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const settingsData = {
        system_name: updatedSettings.systemName,
        logo_url: updatedSettings.logoUrl,
        favicon_url: updatedSettings.faviconUrl,
        primary_color: updatedSettings.primaryColor,
        secondary_color: updatedSettings.secondaryColor,
        webhook_url: updatedSettings.webhookUrl,
        message_webhook_url: updatedSettings.messageWebhookUrl,
        journey_webhook_url: updatedSettings.journeyWebhookUrl
      };

      let result;
      if (settings.id) {
        result = await supabase
          .from('system_settings')
          .update(settingsData)
          .eq('id', settings.id);
      } else {
        result = await supabase
          .from('system_settings')
          .insert(settingsData)
          .select()
          .single();
        
        if (result.data) {
          updatedSettings.id = result.data.id;
        }
      }

      if (result.error) {
        throw result.error;
      }

      setSettings(updatedSettings);
      applyVisualSettings(updatedSettings);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving settings:', error);
      return { success: false, error };
    }
  };

  return { settings, loading, updateSettings, loadSettings };
}
