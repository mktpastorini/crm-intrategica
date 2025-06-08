
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save, Upload } from 'lucide-react';

interface AppearanceSettingsProps {
  settings: any;
  onInputChange: (field: string, value: any) => Promise<void>;
}

export default function AppearanceSettings({ settings, onInputChange }: AppearanceSettingsProps) {
  const { toast } = useToast();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const logoUrl = event.target?.result as string;
        await onInputChange('logoUrl', logoUrl);
        
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
      reader.onload = async (event) => {
        const faviconUrl = event.target?.result as string;
        await onInputChange('faviconUrl', faviconUrl);
        
        toast({
          title: "Favicon atualizado",
          description: "Favicon foi carregado e aplicado ao sistema",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = async (field: 'primaryColor' | 'secondaryColor', value: string) => {
    await onInputChange(field, value);
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
                placeholder="#1d0029"
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

        <Button onClick={handleSave} className="w-full" style={{ backgroundColor: settings.primaryColor }}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações de Aparência
        </Button>
      </CardContent>
    </Card>
  );
}
