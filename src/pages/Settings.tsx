
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useCrm } from '@/contexts/CrmContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings as SettingsIcon, 
  Webhook,
  Database,
  Palette,
  Users,
  Save,
  Upload,
  X,
  Plus,
  Download,
  TestTube,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react';

interface SystemSettings {
  systemName: string;
  webhookUrl: string;
  scheduleReminderHours: number;
  scheduleReminderDays: number;
  enableImmediateSend: boolean;
  dbHost: string;
  dbPort: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  logo: File | null;
  logoUrl: string;
  favicon: File | null;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export default function Settings() {
  const { toast } = useToast();
  const { pipelineStages, addPipelineStage, updatePipelineStage, deletePipelineStage } = useCrm();
  
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('systemSettings');
    return saved ? JSON.parse(saved) : {
      systemName: 'CRM System',
      webhookUrl: '',
      scheduleReminderHours: 2,
      scheduleReminderDays: 1,
      enableImmediateSend: true,
      dbHost: 'gfuoipqwmhfrqhmkqyxp.supabase.co',
      dbPort: '5432',
      dbName: 'postgres',
      dbUser: 'postgres',
      dbPassword: '',
      logo: null,
      logoUrl: '',
      favicon: null,
      faviconUrl: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6'
    };
  });

  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#3b82f6');
  const [editingStage, setEditingStage] = useState<any>(null);
  const [dbTestResult, setDbTestResult] = useState<'success' | 'error' | null>(null);

  // Salvar configurações no localStorage
  const saveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    localStorage.setItem('systemSettings', JSON.stringify(newSettings));
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    const newSettings = { ...settings, [field]: value };
    saveSettings(newSettings);
  };

  const handleSaveWebhooks = () => {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    toast({
      title: "Configurações salvas",
      description: "Configurações de webhook foram salvas com sucesso",
    });
  };

  const handleTestDatabase = async () => {
    try {
      // Simular teste de conexão
      const testConnection = await fetch(`https://${settings.dbHost}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdW9pcHF3bWhmcnFobWtxeXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTYzNzEsImV4cCI6MjA2NDU3MjM3MX0.Y4GnTkvLF-tLDqJX7jZosouYYDESs7n2oV6XUseJV7w'
        }
      });

      if (testConnection.ok) {
        setDbTestResult('success');
        toast({
          title: "Conexão bem-sucedida",
          description: "Conectado ao banco de dados com sucesso",
        });
      } else {
        throw new Error('Falha na conexão');
      }
    } catch (error) {
      setDbTestResult('error');
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao banco de dados",
        variant: "destructive",
      });
    }
  };

  const handleSaveDatabase = () => {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    toast({
      title: "Configurações salvas",
      description: "Configurações de banco de dados foram salvas",
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newSettings = { 
        ...settings, 
        logo: file, 
        logoUrl: URL.createObjectURL(file) 
      };
      saveSettings(newSettings);
      toast({
        title: "Logo carregado",
        description: "Logo foi carregado com sucesso",
      });
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newSettings = { 
        ...settings, 
        favicon: file, 
        faviconUrl: URL.createObjectURL(file) 
      };
      saveSettings(newSettings);
      toast({
        title: "Favicon carregado",
        description: "Favicon foi carregado com sucesso",
      });
    }
  };

  const handleSaveAppearance = () => {
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    toast({
      title: "Aparência salva",
      description: "Configurações de aparência foram salvas",
    });
  };

  const handleAddStage = () => {
    if (!newStageName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o estágio",
        variant: "destructive",
      });
      return;
    }

    const newStage = {
      id: `stage-${Date.now()}`,
      name: newStageName,
      order: pipelineStages.length + 1,
      color: newStageColor
    };

    addPipelineStage(newStage);
    setNewStageName('');
    setNewStageColor('#3b82f6');
  };

  const handleEditStage = (stage: any) => {
    setEditingStage({ ...stage });
  };

  const handleSaveStageEdit = () => {
    if (!editingStage) return;
    updatePipelineStage(editingStage.id, editingStage);
    setEditingStage(null);
  };

  const handleDeleteStage = (stageId: string) => {
    deletePipelineStage(stageId);
  };

  const handleDownloadBackup = () => {
    const allData = {
      leads: JSON.parse(localStorage.getItem('leads') || '[]'),
      events: JSON.parse(localStorage.getItem('events') || '[]'),
      settings: settings,
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
        
        // Restaurar dados
        if (data.leads) localStorage.setItem('leads', JSON.stringify(data.leads));
        if (data.events) localStorage.setItem('events', JSON.stringify(data.events));
        if (data.settings) {
          localStorage.setItem('systemSettings', JSON.stringify(data.settings));
          setSettings(data.settings);
        }
        if (data.templates) localStorage.setItem('messageTemplates', JSON.stringify(data.templates));
        if (data.scheduledMessages) localStorage.setItem('scheduledMessages', JSON.stringify(data.scheduledMessages));

        toast({
          title: "Backup restaurado",
          description: "Dados foram restaurados com sucesso",
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-600">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        {/* Geral */}
        <TabsContent value="general">
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
                  onChange={(e) => handleInputChange('systemName', e.target.value)}
                  placeholder="Digite o nome do sistema"
                />
              </div>
              <Button onClick={() => handleSaveDatabase()}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Webhooks e Automações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">URL do Webhook (Agenda)</Label>
                <Input
                  id="webhook-url"
                  value={settings.webhookUrl}
                  onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                  placeholder="https://sua-url-webhook.com/agenda"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reminder-hours">Lembrete (Horas)</Label>
                  <Input
                    id="reminder-hours"
                    type="number"
                    value={settings.scheduleReminderHours}
                    onChange={(e) => handleInputChange('scheduleReminderHours', parseInt(e.target.value))}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="reminder-days">Lembrete (Dias)</Label>
                  <Input
                    id="reminder-days"
                    type="number"
                    value={settings.scheduleReminderDays}
                    onChange={(e) => handleInputChange('scheduleReminderDays', parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="immediate-send"
                  checked={settings.enableImmediateSend}
                  onCheckedChange={(checked) => handleInputChange('enableImmediateSend', checked)}
                />
                <Label htmlFor="immediate-send">Envio imediato quando evento é criado</Label>
              </div>

              <Button onClick={handleSaveWebhooks}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações de Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banco de Dados */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configuração do Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="db-host">Host</Label>
                  <Input
                    id="db-host"
                    value={settings.dbHost}
                    onChange={(e) => handleInputChange('dbHost', e.target.value)}
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <Label htmlFor="db-port">Porta</Label>
                  <Input
                    id="db-port"
                    value={settings.dbPort}
                    onChange={(e) => handleInputChange('dbPort', e.target.value)}
                    placeholder="5432"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="db-name">Nome do Banco</Label>
                <Input
                  id="db-name"
                  value={settings.dbName}
                  onChange={(e) => handleInputChange('dbName', e.target.value)}
                  placeholder="postgres"
                />
              </div>

              <div>
                <Label htmlFor="db-user">Usuário</Label>
                <Input
                  id="db-user"
                  value={settings.dbUser}
                  onChange={(e) => handleInputChange('dbUser', e.target.value)}
                  placeholder="postgres"
                />
              </div>

              <div>
                <Label htmlFor="db-password">Senha</Label>
                <Input
                  id="db-password"
                  type="password"
                  value={settings.dbPassword}
                  onChange={(e) => handleInputChange('dbPassword', e.target.value)}
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
                <Button onClick={handleSaveDatabase}>
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
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="appearance">
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
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary-color">Cor Secundária</Label>
                  <Input
                    id="secondary-color"
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSaveAppearance}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações de Aparência
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estágios do Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do estágio"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                />
                <Input
                  type="color"
                  value={newStageColor}
                  onChange={(e) => setNewStageColor(e.target.value)}
                  className="w-20"
                />
                <Button onClick={handleAddStage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {pipelineStages.map((stage) => (
                  <div key={stage.id} className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg">
                    {editingStage?.id === stage.id ? (
                      <>
                        <Input
                          value={editingStage.name}
                          onChange={(e) => setEditingStage({ ...editingStage, name: e.target.value })}
                          className="flex-1"
                        />
                        <Input
                          type="color"
                          value={editingStage.color}
                          onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value })}
                          className="w-20"
                        />
                        <Button size="sm" onClick={handleSaveStageEdit}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingStage(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="flex-1 font-medium">{stage.name}</span>
                        <Badge variant="outline">Ordem: {stage.order}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleEditStage(stage)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteStage(stage.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
