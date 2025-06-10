
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import GoogleMapsInstructions from '@/components/GoogleMapsInstructions';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: any[]) => Promise<void>;
}

export default function ImportLeadsDialog({ open, onOpenChange, onImport }: ImportLeadsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleMapsData, setGoogleMapsData] = useState({
    apiKey: '',
    category: '',
    city: '',
    radius: '5'
  });

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

  const handleGoogleMapsImport = async () => {
    if (!googleMapsData.apiKey || !googleMapsData.category || !googleMapsData.city) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Simulação da importação do Google Maps (demonstração)
      // Em um ambiente real, isso faria uma requisição para a Places API
      const mockLeads = [
        {
          name: `${googleMapsData.category} - Empresa 1`,
          phone: "(11) 99999-0001",
          company: `${googleMapsData.category} Ltda 1`,
          email: "contato1@empresa.com",
          niche: googleMapsData.category,
          status: 'novo'
        },
        {
          name: `${googleMapsData.category} - Empresa 2`, 
          phone: "(11) 99999-0002",
          company: `${googleMapsData.category} Ltda 2`,
          email: "contato2@empresa.com",
          niche: googleMapsData.category,
          status: 'novo'
        },
        {
          name: `${googleMapsData.category} - Empresa 3`,
          phone: "(11) 99999-0003", 
          company: `${googleMapsData.category} Ltda 3`,
          email: "contato3@empresa.com",
          niche: googleMapsData.category,
          status: 'novo'
        }
      ];

      await onImport(mockLeads);
      toast({
        title: "Demonstração",
        description: `Importação simulada: ${mockLeads.length} leads de exemplo criados`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro na importação do Google Maps:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar do Google Maps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Extrair do Google Maps (Demonstração)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Demonstração</h4>
                      <p className="text-yellow-800 text-sm">
                        Esta funcionalidade está em modo demonstração e criará leads de exemplo. 
                        Para implementação real, é necessário configurar a API do Google Maps.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api-key">API Key do Google Maps</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={googleMapsData.apiKey}
                      onChange={(e) => setGoogleMapsData(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="AIzaSy..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria/Palavra-chave</Label>
                    <Input
                      id="category"
                      value={googleMapsData.category}
                      onChange={(e) => setGoogleMapsData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="ex: dentista, restaurante, advogado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={googleMapsData.city}
                      onChange={(e) => setGoogleMapsData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="ex: São Paulo, SP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="radius">Raio (km)</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={googleMapsData.radius}
                      onChange={(e) => setGoogleMapsData(prev => ({ ...prev, radius: e.target.value }))}
                      placeholder="5"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGoogleMapsImport} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Importar do Google Maps (Demo)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructions">
            <GoogleMapsInstructions />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
