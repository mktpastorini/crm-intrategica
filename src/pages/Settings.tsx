
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SystemSettings, statusOptions } from '@/types/settings';
import GeneralSettings from '@/components/settings/GeneralSettings';
import WebhookSettings from '@/components/settings/WebhookSettings';
import DatabaseSettings from '@/components/settings/DatabaseSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import CategorySettings from '@/components/settings/CategorySettings';

export default function Settings() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('systemSettings');
    return saved ? JSON.parse(saved) : {
      systemName: 'CRM System',
      webhookUrl: '',
      messageWebhookUrl: '',
      scheduleReminderHours: 2,
      scheduleReminderDays: 1,
      enableImmediateSend: true,
      enableMessageWebhook: false,
      dbHost: 'gfuoipqwmhfrqhmkqyxp.supabase.co',
      dbPort: '5432',
      dbName: 'postgres',
      dbUser: 'postgres',
      dbPassword: '',
      dbUrl: 'https://gfuoipqwmhfrqhmkqyxp.supabase.co',
      dbAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdW9pcHF3bWhmcnFobWtxeXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5OTYzNzEsImV4cCI6MjA2NDU3MjM3MX0.Y4GnTkvLF-tLDqJX7jZosouYYDESs7n2oV6XUseJV7w',
      dbServiceRoleKey: '',
      logo: null,
      logoUrl: '',
      favicon: null,
      faviconUrl: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6'
    };
  });

  const saveSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);
    localStorage.setItem('systemSettings', JSON.stringify(newSettings));
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    const newSettings = { ...settings, [field]: value };
    saveSettings(newSettings);
  };

  const handleSaveGeneral = () => {
    toast({
      title: "Configurações salvas",
      description: "Configurações gerais foram salvas com sucesso",
    });
  };

  const handleSaveWebhooks = () => {
    toast({
      title: "Configurações salvas",
      description: "Configurações de webhook foram salvas com sucesso",
    });
  };

  const handleSaveDatabase = () => {
    toast({
      title: "Configurações salvas",
      description: "Configurações de banco de dados foram salvas",
    });
  };

  const handleSaveAppearance = () => {
    toast({
      title: "Aparência salva",
      description: "Configurações de aparência foram salvas",
    });
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

        <TabsContent value="general">
          <GeneralSettings 
            settings={settings}
            onInputChange={handleInputChange}
            onSave={handleSaveGeneral}
          />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookSettings 
            settings={settings}
            onInputChange={handleInputChange}
            onSave={handleSaveWebhooks}
          />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseSettings 
            settings={settings}
            onInputChange={handleInputChange}
            onSave={handleSaveDatabase}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings 
            settings={settings}
            onInputChange={handleInputChange}
            onSave={handleSaveAppearance}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategorySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
