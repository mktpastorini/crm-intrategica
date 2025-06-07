
import { useState, useEffect, useRef } from 'react';

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
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('systemSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          const mergedSettings = { ...defaultSettings, ...parsedSettings };
          setSettings(mergedSettings);
          
          // Aplicar configurações visuais sem loops
          setTimeout(() => {
            applyVisualSettings(mergedSettings);
          }, 0);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setLoading(false);
        initialized.current = true;
      }
    };

    loadSettings();
  }, []);

  const applyVisualSettings = (settings: Partial<SystemSettings>) => {
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
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('systemSettings', JSON.stringify(updatedSettings));
    
    // Aplicar configurações visuais imediatamente
    setTimeout(() => {
      applyVisualSettings(updatedSettings);
    }, 0);
  };

  return { settings, loading, updateSettings };
}
