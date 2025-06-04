
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Webhook, 
  Database, 
  Palette, 
  Tags,
  Plus,
  Trash2,
  Save,
  TestTube,
  Download,
  Upload,
  Copy
} from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  
  // Webhook settings
  const [webhookSettings, setWebhookSettings] = useState({
    messageWebhook: 'https://api.exemplo.com/webhook/messages',
    calendarWebhook: 'https://api.exemplo.com/webhook/calendar',
    reminderHours: 2,
    reminderDays: 1
  });

  // Categories
  const [categories, setCategories] = useState([
    'Tecnologia',
    'Marketing',
    'Saúde',
    'Educação',
    'E-commerce',
    'Varejo'
  ]);
  const [newCategory, setNewCategory] = useState('');

  // Pipeline stages
  const [pipelineStages, setPipelineStages] = useState([
    { id: 'aguardando-inicio', name: 'Aguardando Início', order: 1, color: '#e11d48' },
    { id: 'primeiro-contato', name: 'Primeiro Contato', order: 2, color: '#f59e0b' },
    { id: 'reuniao', name: 'Reunião', order: 3, color: '#3b82f6' },
    { id: 'proposta-enviada', name: 'Proposta Enviada', order: 4, color: '#8b5cf6' },
    { id: 'negociacao', name: 'Negociação', order: 5, color: '#06b6d4' },
    { id: 'contrato-assinado', name: 'Contrato Assinado', order: 6, color: '#10b981' }
  ]);

  // Database settings
  const [dbSettings, setDbSettings] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    connected: false
  });

  // Generate webhook URL
  const [webhookUrl] = useState(`https://api.crm.com/webhook/${Math.random().toString(36).substr(2, 9)}`);

  const handleSaveWebhooks = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações de webhook foram atualizadas",
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    setCategories(prev => [...prev, newCategory.trim()]);
    setNewCategory('');
    toast({
      title: "Categoria adicionada",
      description: `"${newCategory}" foi adicionada às categorias`,
    });
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(prev => prev.filter(c => c !== category));
    toast({
      title: "Categoria removida",
      description: `"${category}" foi removida das categorias`,
    });
  };

  const handleTestConnection = () => {
    if (!dbSettings.supabaseUrl || !dbSettings.supabaseKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a URL e a chave para testar a conexão",
        variant: "destructive",
      });
      return;
    }

    // Simular teste de conexão
    setTimeout(() => {
      setDbSettings(prev => ({ ...prev, connected: true }));
      toast({
        title: "Conexão bem-sucedida",
        description: "Conectado ao Supabase com sucesso",
      });
    }, 1000);
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "URL copiada",
      description: "URL do webhook copiada para a área de transferência",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h2>
        <p className="text-slate-600">Configure e personalize o funcionamento do CRM</p>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Integração
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="w-4 h-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Banco de Dados
          </TabsTrigger>
        </TabsList>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Webhooks e Automações
              </CardTitle>
              <CardDescription>
                Configure as URLs para integração e automatização do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="message-webhook">Webhook de Disparo de Mensagens</Label>
                    <Input
                      id="message-webhook"
                      value={webhookSettings.messageWebhook}
                      onChange={(e) => setWebhookSettings(prev => ({ ...prev, messageWebhook: e.target.value }))}
                      placeholder="https://api.exemplo.com/webhook/messages"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      URL para envio automático de mensagens
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="calendar-webhook">Webhook da Agenda</Label>
                    <Input
                      id="calendar-webhook"
                      value={webhookSettings.calendarWebhook}
                      onChange={(e) => setWebhookSettings(prev => ({ ...prev, calendarWebhook: e.target.value }))}
                      placeholder="https://api.exemplo.com/webhook/calendar"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      URL para lembretes de compromissos
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reminder-hours">Lembrete de Horas</Label>
                    <Input
                      id="reminder-hours"
                      type="number"
                      value={webhookSettings.reminderHours}
                      onChange={(e) => setWebhookSettings(prev => ({ ...prev, reminderHours: parseInt(e.target.value) }))}
                      min="1"
                      max="24"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Enviar lembrete X horas antes do evento
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="reminder-days">Lembrete de Dias</Label>
                    <Input
                      id="reminder-days"
                      type="number"
                      value={webhookSettings.reminderDays}
                      onChange={(e) => setWebhookSettings(prev => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                      min="1"
                      max="7"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Enviar lembrete X dias antes do evento
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveWebhooks} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integração e Leads Externos</CardTitle>
              <CardDescription>
                Configure o recebimento de leads de fontes externas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Webhook de Recebimento</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={webhookUrl} 
                    readOnly 
                    className="bg-slate-50"
                  />
                  <Button variant="outline" onClick={copyWebhookUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Use esta URL para receber leads de formulários externos
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">Instruções de Uso</h4>
                <div className="space-y-2 text-sm text-slate-700">
                  <p><strong>Método:</strong> POST</p>
                  <p><strong>Content-Type:</strong> application/json</p>
                  <p><strong>Campos esperados:</strong></p>
                  <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`{
  "nome": "João Silva",
  "nome_empresa": "Empresa ABC",
  "telefone": "47999888777",
  "tipo_servico": "Marketing Digital"
}`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Categorias e Nichos</CardTitle>
                <CardDescription>
                  Gerencie as categorias usadas em leads e pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nova categoria"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center justify-between p-2 border border-slate-200 rounded">
                      <Badge variant="outline">{category}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRemoveCategory(category)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estágios do Pipeline</CardTitle>
                <CardDescription>
                  Configure os estágios do funil de vendas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pipelineStages.map((stage) => (
                  <div key={stage.id} className="flex items-center justify-between p-3 border border-slate-200 rounded">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="font-medium">{stage.name}</span>
                      <Badge variant="secondary">{stage.order}</Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Logotipo</CardTitle>
                <CardDescription>
                  Personalize a marca do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Clique para fazer upload do logotipo</p>
                  <p className="text-xs text-slate-500">PNG, JPG até 2MB</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Favicon</CardTitle>
                <CardDescription>
                  Ícone exibido na aba do navegador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">Clique para fazer upload do favicon</p>
                  <p className="text-xs text-slate-500">ICO, PNG 32x32px</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configuração do Supabase
              </CardTitle>
              <CardDescription>
                Configure a conexão com o banco de dados Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="supabase-url">URL do Supabase</Label>
                    <Input
                      id="supabase-url"
                      value={dbSettings.supabaseUrl}
                      onChange={(e) => setDbSettings(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                      placeholder="https://seu-projeto.supabase.co"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supabase-key">Anon Key</Label>
                    <Input
                      id="supabase-key"
                      type="password"
                      value={dbSettings.supabaseKey}
                      onChange={(e) => setDbSettings(prev => ({ ...prev, supabaseKey: e.target.value }))}
                      placeholder="sua-anon-key-aqui"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleTestConnection}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <TestTube className="w-4 h-4" />
                      Testar Conexão
                    </Button>
                    {dbSettings.connected && (
                      <Badge className="bg-green-100 text-green-800">
                        Conectado
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-3">Ações do Banco</h4>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={!dbSettings.connected}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Backup do Banco
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={!dbSettings.connected}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Fazer Upload de Banco
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
