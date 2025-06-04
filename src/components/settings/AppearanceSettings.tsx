
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save, Upload } from 'lucide-react';
import { SystemSettings } from '@/types/settings';

interface AppearanceSettingsProps {
  settings: SystemSettings;
  onInputChange: (field: keyof SystemSettings, value: any) => void;
  onSave: () => void;
}

export default function AppearanceSettings({ settings, onInputChange, onSave }: AppearanceSettingsProps) {
  const { toast } = useToast();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onInputChange('logo', file);
      onInputChange('logoUrl', URL.createObjectURL(file));
      toast({
        title: "Logo carregado",
        description: "Logo foi carregado com sucesso",
      });
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onInputChange('favicon', file);
      onInputChange('faviconUrl', URL.createObjectURL(file));
      toast({
        title: "Favicon carregado",
        description: "Favicon foi carregado com sucesso",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Aparência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Logo do Sistema</Label>
          <div className="mt-2 space-y-2">
            {settings.logoUrl && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                <span className="text-sm text-slate-700 flex-1">Logo atual</span>
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
              Selecionar Logo
            </Button>
          </div>
        </div>

        <div>
          <Label>Favicon</Label>
          <div className="mt-2 space-y-2">
            {settings.faviconUrl && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                <img src={settings.faviconUrl} alt="Favicon" className="w-4 h-4 object-contain" />
                <span className="text-sm text-slate-700 flex-1">Favicon atual</span>
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
              Selecionar Favicon
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary-color">Cor Primária</Label>
            <Input
              id="primary-color"
              type="color"
              value={settings.primaryColor}
              onChange={(e) => onInputChange('primaryColor', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="secondary-color">Cor Secundária</Label>
            <Input
              id="secondary-color"
              type="color"
              value={settings.secondaryColor}
              onChange={(e) => onInputChange('secondaryColor', e.target.value)}
            />
          </div>
        </div>

        <Button onClick={onSave}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações de Aparência
        </Button>
      </CardContent>
    </Card>
  );
}
