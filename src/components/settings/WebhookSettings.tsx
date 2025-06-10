
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

interface WebhookSettingsProps {
  settings: any;
  onInputChange: (field: string, value: any) => Promise<void>;
  onSave: () => void;
}

export default function WebhookSettings({ settings, onInputChange, onSave }: WebhookSettingsProps) {
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

          <Button onClick={onSave} className="w-full" style={{ backgroundColor: settings.primaryColor }}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações de Webhooks
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
