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
import ApiDocumentation from '@/components/settings/ApiDocumentation';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Settings() {
  const { toast } = useToast();
  const { settings, updateSettings } = useSystemSettingsDB();
  const isMobile = useIsMobile();

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
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'grid-cols-7'} ${isMobile ? 'gap-1' : ''}`}>
          <TabsTrigger value="general" className={isMobile ? 'text-xs px-2' : ''}>
            {isMobile ? 'Geral' : 'Geral'}
          </TabsTrigger>
          <TabsTrigger value="webhooks" className={isMobile ? 'text-xs px-2' : ''}>
            {isMobile ? 'Hooks' : 'Webhooks'}
          </TabsTrigger>
          <TabsTrigger value="database" className={isMobile ? 'text-xs px-2' : ''}>
            {isMobile ? 'BD' : 'Banco de Dados'}
          </TabsTrigger>
          {!isMobile && <TabsTrigger value="appearance">Aparência</TabsTrigger>}
          {!isMobile && <TabsTrigger value="categories">Categorias</TabsTrigger>}
          {!isMobile && <TabsTrigger value="googlemaps">Google Maps</TabsTrigger>}
          {!isMobile && <TabsTrigger value="api-docs">API</TabsTrigger>}
        </TabsList>

        {isMobile && (
          <TabsList className="grid w-full grid-cols-4 gap-1 mt-2">
            <TabsTrigger value="appearance" className="text-xs px-2">
              Aparência
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs px-2">
              Categorias
            </TabsTrigger>
            <TabsTrigger value="googlemaps" className="text-xs px-2">
              Maps
            </TabsTrigger>
            <TabsTrigger value="api-docs" className="text-xs px-2">
              API
            </TabsTrigger>
          </TabsList>
        )}

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

        <TabsContent value="api-docs">
          <ApiDocumentation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
