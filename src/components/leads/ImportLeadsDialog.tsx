
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, MapPin, AlertCircle } from 'lucide-react';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import GoogleMapsInstructions from '@/components/GoogleMapsInstructions';
import GoogleMapsSearch from '@/components/GoogleMapsSearch';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: any[]) => Promise<void>;
}

export default function ImportLeadsDialog({ open, onOpenChange, onImport }: ImportLeadsDialogProps) {
  const { toast } = useToast();
  const { settings } = useSystemSettingsDB();
  const [loading, setLoading] = useState(false);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(csv|txt)$/i)) {
      toast({
        title: "Erro",
        description: "Apenas arquivos CSV ou TXT são permitidos",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Erro",
          description: "O arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados",
          variant: "destructive",
        });
        return;
      }

      // Parse CSV/TXT
      const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase());
      const leads = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,;\t]/).map(v => v.trim());
        if (values.length >= 3) { // Mínimo: nome, telefone, empresa
          const lead = {
            name: values[headers.indexOf('nome') || headers.indexOf('name') || 0] || `Lead ${i}`,
            phone: values[headers.indexOf('telefone') || headers.indexOf('phone') || 1] || '',
            company: values[headers.indexOf('empresa') || headers.indexOf('company') || 2] || '',
            email: values[headers.indexOf('email') || headers.indexOf('e-mail')] || '',
            niche: values[headers.indexOf('nicho') || headers.indexOf('niche')] || 'Importado',
            status: 'novo'
          };
          leads.push(lead);
        }
      }

      if (leads.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhum lead válido encontrado no arquivo",
          variant: "destructive",
        });
        return;
      }

      await onImport(leads);
      toast({
        title: "Sucesso",
        description: `${leads.length} leads importados com sucesso`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMapsImport = async (leads: any[]) => {
    try {
      await onImport(leads);
      toast({
        title: "Sucesso",
        description: `${leads.length} leads importados do Google Maps`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar leads",
        variant: "destructive",
      });
    }
  };

  const hasGoogleMapsKey = settings?.google_maps_api_key;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Leads em Massa</DialogTitle>
          <DialogDescription>
            Importe leads de arquivos CSV/TXT ou extraia diretamente do Google Maps
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">Arquivo CSV/TXT</TabsTrigger>
            <TabsTrigger value="google-maps">Google Maps</TabsTrigger>
            <TabsTrigger value="instructions">Configuração API</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Importar de Arquivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Formato do Arquivo</h4>
                  <p className="text-blue-800 text-sm mb-2">
                    Seu arquivo deve conter as seguintes colunas (separadas por vírgula, ponto-e-vírgula ou tab):
                  </p>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• <strong>Nome</strong> (obrigatório)</li>
                    <li>• <strong>Telefone</strong> (obrigatório)</li>
                    <li>• <strong>Empresa</strong> (obrigatório)</li>
                    <li>• <strong>Email</strong> (opcional)</li>
                    <li>• <strong>Nicho</strong> (opcional)</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Exemplo de CSV</h4>
                  <code className="text-green-800 text-xs block whitespace-pre-wrap">
                    Nome,Telefone,Empresa,Email,Nicho{'\n'}
                    João Silva,(11) 99999-1111,Silva Construções,joao@silva.com,Construção{'\n'}
                    Maria Santos,(11) 99999-2222,Santos Consultoria,maria@santos.com,Consultoria
                  </code>
                </div>

                <div>
                  <Label htmlFor="file-upload">Selecionar Arquivo</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileImport}
                    disabled={loading}
                    className="mt-1"
                  />
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-slate-600">Processando arquivo...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="google-maps" className="space-y-4">
            {!hasGoogleMapsKey ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Configuração Necessária
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800 text-sm mb-3">
                      Para usar a importação do Google Maps, é necessário configurar uma chave da API do Google Maps.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                      className="text-orange-700 border-orange-300 hover:bg-orange-100"
                    >
                      Ir para Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <GoogleMapsSearch 
                apiKey={settings.google_maps_api_key}
                onImport={handleGoogleMapsImport}
              />
            )}
          </TabsContent>

          <TabsContent value="instructions">
            <GoogleMapsInstructions />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
