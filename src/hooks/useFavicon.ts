
import { useEffect } from 'react';
import { useSystemSettingsDB } from './useSystemSettingsDB';

export function useFavicon() {
  const { settings } = useSystemSettingsDB();

  useEffect(() => {
    if (settings.faviconUrl) {
      // Remove existing favicon
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }

      // Create new favicon
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = settings.faviconUrl;
      newFavicon.type = 'image/png';
      
      document.head.appendChild(newFavicon);
    }

    // Update title if systemName is available
    if (settings.systemName) {
      document.title = settings.systemName;
    }
  }, [settings.faviconUrl, settings.systemName]);
}
