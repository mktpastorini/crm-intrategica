
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AppearanceSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    systemName: 'CRM System',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6'
  });

  // Carregar configurações do localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({
          systemName: parsedSettings.systemName || 'CRM System',
          logoUrl: parsedSettings.logoUrl || '',
          faviconUrl: parsedSettings.faviconUrl || '',
          primaryColor: parsedSettings.primaryColor || '#3b82f6',
          secondaryColor: parsedSettings.secondaryColor || '#8b5cf6'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, []);

  const updateSettings = (newSettings: Partial<typeof settings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Salvar no localStorage
      const currentSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
      const mergedSettings = { ...currentSettings, ...updatedSettings };
      localStorage.setItem('systemSettings', JSON.stringify(mergedSettings));
      
      // Aplicar mudanças visuais imediatamente
      applyVisualSettings(updatedSettings);
      
      // Disparar evento customizado para notificar outros componentes
      window.dispatchEvent(new Event('systemSettingsChanged'));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const applyVisualSettings = (settings: Partial<typeof settings>) => {
    try {
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
      
      // Aplicar título do sistema
      if (settings.systemName) {
        document.title = settings.systemName;
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const logoUrl = event.target?.result as string;
        updateSettings({ logoUrl });
        
        toast({
          title: "Logo atualizado",
          description: "Logo foi carregado e aplicado ao sistema",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const faviconUrl = event.target?.result as string;
        updateSettings({ faviconUrl });
        
        toast({
          title: "Favicon atualizado",
          description: "Favicon foi carregado e aplicado ao sistema",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor', value: string) => {
    updateSettings({ [field]: value });
  };

  const handleSave = () => {
    toast({
      title: "Aparência salva",
      description: "Configurações de aparência foram salvas",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Aparência do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Logo do Sistema</Label>
          <div className="mt-2 space-y-2">
            {settings.logoUrl && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" data-logo />
                <div className="flex-1">
                  <span className="text-sm text-slate-700">Logo atual</span>
                  <p className="text-xs text-slate-500">Aplicado em todo o sistema</p>
                </div>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <Button 
              onClick={() => document.getElementById('logo-upload')?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {settings.logoUrl ? 'Alterar Logo' : 'Selecionar Logo'}
            </Button>
          </div>
        </div>

        <div>
          <Label>Favicon (Ícone da Aba)</Label>
          <div className="mt-2 space-y-2">
            {settings.faviconUrl && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                <img src={settings.faviconUrl} alt="Favicon" className="w-6 h-6 object-contain" />
                <div className="flex-1">
                  <span className="text-sm text-slate-700">Favicon atual</span>
                  <p className="text-xs text-slate-500">Exibido na aba do navegador</p>
                </div>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleFaviconUpload}
              className="hidden"
              id="favicon-upload"
            />
            <Button 
              onClick={() => document.getElementById('favicon-upload')?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {settings.faviconUrl ? 'Alterar Favicon' : 'Selecionar Favicon'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary-color">Cor Primária</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="primary-color"
                type="color"
                value={settings.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={settings.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="secondary-color">Cor Secundária</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="secondary-color"
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                className="w-16 h-10"
              />
              <Input
                value={settings.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                placeholder="#8b5cf6"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações de Aparência
        </Button>
      </CardContent>
    </Card>
  );
}
