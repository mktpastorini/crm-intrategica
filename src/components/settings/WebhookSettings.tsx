
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import ReportSettings from './ReportSettings';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';

interface WebhookSettingsProps {
  settings: any;
  onInputChange: (field: string, value: any) => Promise<void>;
  onSave: () => void;
}

export default function WebhookSettings({ settings, onInputChange, onSave }: WebhookSettingsProps) {
  const { toast } = useToast();
  const [testing, setTesting] = React.useState(false);

  const handleTestJourneyWebhook = async () => {
    if (!settings.journeyWebhookUrl) {
      toast({
        title: "Erro",
        description: "Informe a URL do Webhook da Jornada do Cliente antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    const testPayload = {
      test: true,
      lead: {
        id: "1234",
        name: "Lead Teste",
        phone: "+5511999999999",
        email: "teste@cliente.com"
      },
      message: {
        id: "msg-101",
        content: "Mensagem de test automatizado do webhook da Jornada.",
        stage: "contato_inicial",
        scheduledAt: new Date().toISOString(),
      }
    };

    try {
      const response = await fetch(settings.journeyWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        toast({
          title: "Webhook enviado!",
          description: "O teste foi disparado para o Webhook da Jornada do Cliente.",
        });
      } else {
        toast({
          title: "Erro ao disparar webhook",
          description: `Status: ${response.status}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Falha ao disparar webhook",
        description: error?.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Webhook da Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook-url">URL do Webhook (Agenda)</Label>
            <Input
              id="webhook-url"
              value={settings.webhookUrl || ''}
              onChange={(e) => onInputChange('webhookUrl', e.target.value)}
              placeholder="https://sua-url-webhook.com/agenda"
            />
          </div>
          <div>
            <Label htmlFor="webhook-hours-before">Horas antes do evento para disparar</Label>
            <Select 
              value={settings.webhookHoursBefore?.toString() || '2'} 
              onValueChange={(value) => onInputChange('webhookHoursBefore', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione as horas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No momento do evento</SelectItem>
                <SelectItem value="1">1 hora antes</SelectItem>
                <SelectItem value="2">2 horas antes</SelectItem>
                <SelectItem value="4">4 horas antes</SelectItem>
                <SelectItem value="8">8 horas antes</SelectItem>
                <SelectItem value="24">1 dia antes</SelectItem>
                <SelectItem value="48">2 dias antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Configuração de Disparo</Label>
            <p className="text-sm text-slate-600 mb-2">
              O webhook será disparado automaticamente no horário configurado antes de cada evento.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook de Mensagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="message-webhook-url">URL do Webhook (Mensagens)</Label>
            <Input
              id="message-webhook-url"
              value={settings.messageWebhookUrl || ''}
              onChange={(e) => onInputChange('messageWebhookUrl', e.target.value)}
              placeholder="https://sua-url-webhook.com/messages"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook da Jornada do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="journey-webhook-url">URL do Webhook (Jornada)</Label>
            <Input
              id="journey-webhook-url"
              value={settings.journeyWebhookUrl || ''}
              onChange={(e) => onInputChange('journeyWebhookUrl', e.target.value)}
              placeholder="https://sua-url-webhook.com/journey"
            />
          </div>
          <p className="text-sm text-slate-600">
            Este webhook será usado para enviar as mensagens automáticas da jornada do cliente quando leads mudarem de estágio.
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button 
              onClick={onSave} 
              className="w-full sm:w-auto"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações de Webhooks
            </Button>
            <Button 
              onClick={handleTestJourneyWebhook} 
              variant="outline" 
              className="w-full sm:w-auto"
              disabled={testing}
            >
              {testing ? "Testando..." : "Testar Webhook"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ReportSettings 
        settings={settings}
        onInputChange={onInputChange}
        onSave={onSave}
      />
    </div>
  );
}
