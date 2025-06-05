
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Save } from 'lucide-react';
import { SystemSettings } from '@/types/settings';

interface WebhookSettingsProps {
  settings: SystemSettings;
  onInputChange: (field: keyof SystemSettings, value: any) => void;
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
              value={settings.webhookUrl}
              onChange={(e) => onInputChange('webhookUrl', e.target.value)}
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
                onChange={(e) => onInputChange('scheduleReminderHours', parseInt(e.target.value))}
                placeholder="2"
              />
            </div>
            <div>
              <Label htmlFor="reminder-days">Lembrete (Dias)</Label>
              <Input
                id="reminder-days"
                type="number"
                value={settings.scheduleReminderDays}
                onChange={(e) => onInputChange('scheduleReminderDays', parseInt(e.target.value))}
                placeholder="1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="immediate-send"
              checked={settings.enableImmediateSend}
              onCheckedChange={(checked) => onInputChange('enableImmediateSend', checked)}
            />
            <Label htmlFor="immediate-send">Envio imediato quando evento da agenda é criado</Label>
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
              value={settings.messageWebhookUrl}
              onChange={(e) => onInputChange('messageWebhookUrl', e.target.value)}
              placeholder="https://sua-url-webhook.com/messages"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-message-webhook"
              checked={settings.enableMessageWebhook}
              onCheckedChange={(checked) => onInputChange('enableMessageWebhook', checked)}
            />
            <Label htmlFor="enable-message-webhook">Habilitar webhook para envio de mensagens</Label>
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
              value={settings.journeyWebhookUrl}
              onChange={(e) => onInputChange('journeyWebhookUrl', e.target.value)}
              placeholder="https://sua-url-webhook.com/journey"
            />
          </div>
          <p className="text-sm text-slate-600">
            Este webhook será usado para enviar as mensagens automáticas da jornada do cliente quando leads mudarem de estágio.
          </p>

          <Button onClick={onSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações de Webhooks
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
