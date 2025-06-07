
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
          
          // Aplicar configurações visuais uma única vez
          setTimeout(() => {
            applyVisualSettings(mergedSettings);
          }, 100);
        } else {
          // Aplicar configurações padrão
          setTimeout(() => {
            applyVisualSettings(defaultSettings);
          }, 100);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setTimeout(() => {
          applyVisualSettings(defaultSettings);
        }, 100);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []); // Array vazio - executar apenas uma vez

  const applyVisualSettings = (settings: Partial<SystemSettings>) => {
    try {
      // Aplicar logo
      if (settings.logoUrl) {
        const logoElements = document.querySelectorAll('[data-logo]');
        logoElements.forEach(element => {
          if (element instanceof HTMLImageElement) {
            element.src = settings.logoUrl;
          }
        });
      }
      
      // Aplicar favicon
      if (settings.faviconUrl) {
        let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = settings.faviconUrl;
      }
      
      // Aplicar cores
      const root = document.documentElement;
      if (settings.primaryColor) {
        root.style.setProperty('--primary-color', settings.primaryColor);
      }
      if (settings.secondaryColor) {
        root.style.setProperty('--secondary-color', settings.secondaryColor);
      }
    } catch (error) {
      console.error('Erro ao aplicar configurações visuais:', error);
    }
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
      
      // Aplicar as novas configurações visuais
      setTimeout(() => {
        applyVisualSettings(updatedSettings);
      }, 100);
      
      console.log('Configurações atualizadas e salvas:', updatedSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  return { settings, loading, updateSettings };
}
