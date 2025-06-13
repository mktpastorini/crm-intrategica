
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Send, TestTube, Phone } from 'lucide-react';

interface ReportSettingsProps {
  settings: any;
  onInputChange: (field: string, value: any) => Promise<void>;
  onSave: () => void;
}

export default function ReportSettings({ settings, onInputChange, onSave }: ReportSettingsProps) {
  const { toast } = useToast();

  const handleTestWebhook = async () => {
    if (!settings.reportWebhookUrl) {
      toast({
        title: "URL necessária",
        description: "Configure a URL do webhook antes de testar",
        variant: "destructive",
      });
      return;
    }

    try {
      const testData = {
        date: new Date().toISOString().split('T')[0],
        summary: {
          leads_added: 5,
          leads_moved: {
            "Pendente": 2,
            "Qualificado": 3,
            "Proposta": 1,
            "Fechado": 2
          },
          messages_sent: 12,
          events_created: 4
        },
        details: {
          total_activities: 24,
          system_name: settings.systemName || "Sistema CRM"
        },
        whatsapp_number: settings.reportWhatsappNumber || '',
        test: true
      };

      const { data, error } = await supabase.functions.invoke('daily-report-webhook', {
        body: { 
          webhookUrl: settings.reportWebhookUrl,
          reportData: testData
        }
      });

      if (error) {
        console.error('Erro ao testar webhook:', error);
        toast({
          title: "Erro no teste",
          description: "Erro ao enviar dados de teste para o webhook",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Teste enviado",
          description: "Dados de teste foram enviados para o webhook com sucesso",
        });
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      toast({
        title: "Erro no teste",
        description: "Erro ao enviar dados de teste",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Relatório Diário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="report-enabled"
              checked={settings.reportWebhookEnabled || false}
              onCheckedChange={(checked) => onInputChange('reportWebhookEnabled', checked)}
            />
            <Label htmlFor="report-enabled">Habilitar relatório diário automático</Label>
          </div>

          <div>
            <Label htmlFor="report-webhook-url">URL do Webhook (Relatório)</Label>
            <Input
              id="report-webhook-url"
              value={settings.reportWebhookUrl || ''}
              onChange={(e) => onInputChange('reportWebhookUrl', e.target.value)}
              placeholder="https://sua-url-webhook.com/relatorio"
            />
          </div>
          
          <div>
            <Label htmlFor="report-time">Horário de Envio</Label>
            <Input
              id="report-time"
              type="time"
              value={settings.reportWebhookTime || '18:00'}
              onChange={(e) => onInputChange('reportWebhookTime', e.target.value)}
            />
            <p className="text-sm text-slate-600 mt-1">
              Horário para envio automático do relatório diário
            </p>
          </div>

          <div>
            <Label htmlFor="report-whatsapp" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Número do WhatsApp
            </Label>
            <Input
              id="report-whatsapp"
              value={settings.reportWhatsappNumber || ''}
              onChange={(e) => onInputChange('reportWhatsappNumber', e.target.value)}
              placeholder="5511999999999"
            />
            <p className="text-sm text-slate-600 mt-1">
              Número do WhatsApp que será enviado junto com o relatório (formato: 5511999999999)
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">O que será incluído no relatório:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Quantidade de leads adicionados</li>
              <li>• Leads movidos entre estágios do pipeline</li>
              <li>• Número de mensagens enviadas</li>
              <li>• Eventos da agenda criados</li>
              <li>• Número do WhatsApp configurado</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={onSave} className="flex-1" style={{ backgroundColor: settings.primaryColor }}>
              <Send className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
            <Button 
              onClick={handleTestWebhook} 
              variant="outline"
              disabled={!settings.reportWebhookUrl}
            >
              <TestTube className="w-4 h-4 mr-2" />
              Testar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
