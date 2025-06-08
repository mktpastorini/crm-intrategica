
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save } from 'lucide-react';

interface GeneralSettingsProps {
  settings: any;
  onInputChange: (field: string, value: any) => Promise<void>;
  onSave: () => void;
}

export default function GeneralSettings({ settings, onInputChange, onSave }: GeneralSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Configurações Gerais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="system-name">Nome do Sistema</Label>
          <Input
            id="system-name"
            value={settings.systemName}
            onChange={(e) => onInputChange('systemName', e.target.value)}
            placeholder="Digite o nome do sistema (opcional)"
          />
          <p className="text-xs text-slate-500 mt-1">
            Deixe em branco se não quiser exibir um nome do sistema
          </p>
        </div>
        <Button onClick={onSave} style={{ backgroundColor: settings.primaryColor }}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
