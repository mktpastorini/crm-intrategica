
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Database,
  Save,
  Upload,
  Download,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { SystemSettings } from '@/types/settings';

interface DatabaseSettingsProps {
  settings: SystemSettings;
  onInputChange: (field: keyof SystemSettings, value: any) => void;
  onSave: () => void;
}

export default function DatabaseSettings({ settings, onInputChange, onSave }: DatabaseSettingsProps) {
  const { toast } = useToast();
  const [dbTestResult, setDbTestResult] = useState<'success' | 'error' | null>(null);

  const handleTestDatabase = async () => {
    try {
      if (!settings.dbUrl || !settings.dbAnonKey) {
        throw new Error('URL e Anon Key são obrigatórios');
      }

      const response = await fetch(`${settings.dbUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': settings.dbAnonKey,
          'Authorization': `Bearer ${settings.dbAnonKey}`
        }
      });

      if (response.ok) {
        setDbTestResult('success');
        toast({
          title: "Conexão bem-sucedida",
          description: "Conectado ao Supabase com sucesso",
        });
      } else {
        throw new Error('Falha na conexão');
      }
    } catch (error) {
      setDbTestResult('error');
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao Supabase. Verifique as credenciais.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadBackup = () => {
    const allData = {
      leads: JSON.parse(localStorage.getItem('leads') || '[]'),
      events: JSON.parse(localStorage.getItem('events') || '[]'),
      settings: settings,
      leadStatuses: JSON.parse(localStorage.getItem('leadStatuses') || '[]'),
      pipelineStages: JSON.parse(localStorage.getItem('pipelineStages') || '[]'),
      templates: JSON.parse(localStorage.getItem('messageTemplates') || '[]'),
      scheduledMessages: JSON.parse(localStorage.getItem('scheduledMessages') || '[]')
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup criado",
      description: "Backup dos dados foi baixado com sucesso",
    });
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (data.leads) localStorage.setItem('leads', JSON.stringify(data.leads));
        if (data.events) localStorage.setItem('events', JSON.stringify(data.events));
        if (data.settings) {
          localStorage.setItem('systemSettings', JSON.stringify(data.settings));
          Object.keys(data.settings).forEach(key => {
            onInputChange(key as keyof SystemSettings, data.settings[key]);
          });
        }
        if (data.leadStatuses) localStorage.setItem('leadStatuses', JSON.stringify(data.leadStatuses));
        if (data.pipelineStages) localStorage.setItem('pipelineStages', JSON.stringify(data.pipelineStages));
        if (data.templates) localStorage.setItem('messageTemplates', JSON.stringify(data.templates));
        if (data.scheduledMessages) localStorage.setItem('scheduledMessages', JSON.stringify(data.scheduledMessages));

        toast({
          title: "Backup restaurado",
          description: "Dados foram restaurados com sucesso. Recarregue a página para ver as mudanças.",
        });
      } catch (error) {
        toast({
          title: "Erro no backup",
          description: "Arquivo de backup inválido",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Configuração do Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="db-url">URL do Projeto Supabase</Label>
          <Input
            id="db-url"
            value={settings.dbUrl}
            onChange={(e) => onInputChange('dbUrl', e.target.value)}
            placeholder="https://seu-projeto.supabase.co"
          />
        </div>

        <div>
          <Label htmlFor="db-anon-key">Anon Key (Público)</Label>
          <Textarea
            id="db-anon-key"
            value={settings.dbAnonKey}
            onChange={(e) => onInputChange('dbAnonKey', e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="db-service-role-key">Service Role Key (Privado)</Label>
          <Textarea
            id="db-service-role-key"
            value={settings.dbServiceRoleKey}
            onChange={(e) => onInputChange('dbServiceRoleKey', e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="db-host">Host</Label>
            <Input
              id="db-host"
              value={settings.dbHost}
              onChange={(e) => onInputChange('dbHost', e.target.value)}
              placeholder="projeto.supabase.co"
            />
          </div>
          <div>
            <Label htmlFor="db-port">Porta</Label>
            <Input
              id="db-port"
              value={settings.dbPort}
              onChange={(e) => onInputChange('dbPort', e.target.value)}
              placeholder="5432"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="db-name">Nome do Banco</Label>
            <Input
              id="db-name"
              value={settings.dbName}
              onChange={(e) => onInputChange('dbName', e.target.value)}
              placeholder="postgres"
            />
          </div>
          <div>
            <Label htmlFor="db-user">Usuário</Label>
            <Input
              id="db-user"
              value={settings.dbUser}
              onChange={(e) => onInputChange('dbUser', e.target.value)}
              placeholder="postgres"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="db-password">Senha</Label>
          <Input
            id="db-password"
            type="password"
            value={settings.dbPassword}
            onChange={(e) => onInputChange('dbPassword', e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleTestDatabase} variant="outline">
            <TestTube className="w-4 h-4 mr-2" />
            Testar Conexão
            {dbTestResult === 'success' && <CheckCircle className="w-4 h-4 ml-2 text-green-600" />}
            {dbTestResult === 'error' && <XCircle className="w-4 h-4 ml-2 text-red-600" />}
          </Button>
          <Button onClick={onSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configuração
          </Button>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4">Backup e Restauração</h3>
          <div className="flex gap-2">
            <Button onClick={handleDownloadBackup} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Baixar Backup
            </Button>
            <div>
              <Input
                type="file"
                accept=".json"
                onChange={handleUploadBackup}
                className="hidden"
                id="backup-upload"
              />
              <Button 
                onClick={() => document.getElementById('backup-upload')?.click()}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                Restaurar Backup
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
