
import { useState, useEffect } from 'react';

interface SystemSettings {
  systemName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

const defaultSettings: SystemSettings = {
  systemName: 'CRM System',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6'
};

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('systemSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          const mergedSettings = { ...defaultSettings, ...parsedSettings };
          setSettings(mergedSettings);
          applyVisualSettings(mergedSettings);
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

    loadSettings();

    // Listener para mudanças nas configurações
    const handleStorageChange = () => {
      loadSettings();
    };

    // Listener apenas para eventos customizados (não storage)
    window.addEventListener('systemSettingsChanged', handleStorageChange);

    return () => {
      window.removeEventListener('systemSettingsChanged', handleStorageChange);
    };
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
      
      // Apply system name to title
      if (settings.systemName) {
        document.title = settings.systemName;
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

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
      applyVisualSettings(updatedSettings);
      
      // Disparar evento customizado
      window.dispatchEvent(new Event('systemSettingsChanged'));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return { settings, loading, updateSettings };
}
