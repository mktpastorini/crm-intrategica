
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import GeneralSettings from '@/components/settings/GeneralSettings';
import WebhookSettings from '@/components/settings/WebhookSettings';
import DatabaseSettings from '@/components/settings/DatabaseSettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import CategorySettings from '@/components/settings/CategorySettings';
import GoogleMapsSettings from '@/components/settings/GoogleMapsSettings';

export default function Settings() {
  const { toast } = useToast();
  const { settings, updateSettings } = useSystemSettingsDB();

  const handleInputChange = async (field: string, value: any) => {
    const result = await updateSettings({ [field]: value });
    if (!result.success) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive",
      });
    }
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

  const handleSaveGoogleMaps = () => {
    toast({
      title: "Configurações salvas",
      description: "Configurações do Google Maps foram salvas com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Configurações</h2>
        <p className="text-slate-600">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="googlemaps">Google Maps</TabsTrigger>
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
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategorySettings />
        </TabsContent>

        <TabsContent value="googlemaps">
          <GoogleMapsSettings 
            settings={settings}
            onInputChange={handleInputChange}
            onSave={handleSaveGoogleMaps}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
