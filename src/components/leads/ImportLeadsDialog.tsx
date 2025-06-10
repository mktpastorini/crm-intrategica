
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, MapPin, Info } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: any[]) => void;
}

export default function ImportLeadsDialog({ open, onOpenChange, onImport }: ImportLeadsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [googleMapsData, setGoogleMapsData] = useState({
    keyword: '',
    city: '',
    radius: '10',
    limit: '50'
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };

  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leads = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const lead: any = {};

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Map common column names
        if (header.includes('nome') || header.includes('name')) {
          lead.name = value;
        } else if (header.includes('empresa') || header.includes('company')) {
          lead.company = value;
        } else if (header.includes('telefone') || header.includes('phone')) {
          lead.phone = value;
        } else if (header.includes('email')) {
          lead.email = value;
        } else if (header.includes('nicho') || header.includes('niche') || header.includes('categoria')) {
          lead.niche = value;
        }
      });

      // Validate required fields
      if (lead.name && lead.company && lead.phone) {
        leads.push({
          ...lead,
          status: 'novo',
          responsible_id: ''
        });
      }
    }

    return leads;
  };

  const handleCSVImport = async () => {
    if (!fileContent.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para importar",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const leads = parseCSV(fileContent);
      
      if (leads.length === 0) {
        throw new Error('Nenhum lead válido encontrado no arquivo');
      }

      onImport(leads);
      toast({
        title: "Importação realizada",
        description: `${leads.length} leads importados com sucesso`,
      });
      onOpenChange(false);
      setFileContent('');
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar arquivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMapsImport = async () => {
    if (!googleMapsData.keyword || !googleMapsData.city) {
      toast({
        title: "Erro",
        description: "Preencha a palavra-chave e cidade",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Simular extração do Google Maps (em um cenário real, isso seria feito no backend)
      // Por limitações da API do Google Places, vamos simular dados
      const mockLeads = [
        {
          name: "João Silva",
          company: `${googleMapsData.keyword} Silva Ltda`,
          phone: "(11) 99999-9999",
          email: "contato@silva.com",
          niche: googleMapsData.keyword,
          status: 'novo',
          responsible_id: ''
        },
        {
          name: "Maria Santos",
          company: `${googleMapsData.keyword} Santos & Cia`,
          phone: "(11) 88888-8888",
          email: "maria@santos.com",
          niche: googleMapsData.keyword,
          status: 'novo',
          responsible_id: ''
        }
      ];

      onImport(mockLeads);
      toast({
        title: "Importação realizada",
        description: `${mockLeads.length} leads importados do Google Maps`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar do Google Maps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Leads em Massa</DialogTitle>
          <DialogDescription>
            Importe leads de arquivos CSV/TXT ou extraia do Google Maps
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">
              <FileText className="w-4 h-4 mr-2" />
              Arquivo CSV/TXT
            </TabsTrigger>
            <TabsTrigger value="google-maps">
              <MapPin className="w-4 h-4 mr-2" />
              Google Maps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Formato do Arquivo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <p>O arquivo deve conter as seguintes colunas (separadas por vírgula):</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>nome</strong> - Nome do contato (obrigatório)</li>
                  <li><strong>empresa</strong> - Nome da empresa (obrigatório)</li>
                  <li><strong>telefone</strong> - Telefone de contato (obrigatório)</li>
                  <li><strong>email</strong> - Email (opcional)</li>
                  <li><strong>nicho</strong> - Segmento/categoria (opcional)</li>
                </ul>
                <p className="mt-2 text-xs">
                  Exemplo: nome,empresa,telefone,email,nicho
                </p>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="file-upload">Selecionar Arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="mt-1"
              />
            </div>

            {fileContent && (
              <div>
                <Label>Prévia do Arquivo</Label>
                <Textarea
                  value={fileContent.substring(0, 500) + (fileContent.length > 500 ? '...' : '')}
                  readOnly
                  className="mt-1 h-32"
                />
              </div>
            )}

            <Button onClick={handleCSVImport} disabled={loading || !fileContent} className="w-full">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Arquivo
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="google-maps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Info className="w-4 h-4 mr-2" />
                  Extração do Google Maps
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                <p>Esta funcionalidade extrai informações de empresas do Google Maps baseada nos critérios de busca.</p>
                <p className="mt-2 text-yellow-600">
                  <strong>Nota:</strong> Esta é uma versão demonstrativa. Em produção, seria necessário configurar APIs apropriadas.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keyword">Palavra-chave</Label>
                <Input
                  id="keyword"
                  placeholder="Ex: restaurante, loja, clínica"
                  value={googleMapsData.keyword}
                  onChange={(e) => setGoogleMapsData(prev => ({ ...prev, keyword: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  placeholder="Ex: São Paulo, SP"
                  value={googleMapsData.city}
                  onChange={(e) => setGoogleMapsData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="radius">Raio (km)</Label>
                <Select value={googleMapsData.radius} onValueChange={(value) => setGoogleMapsData(prev => ({ ...prev, radius: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="limit">Limite de resultados</Label>
                <Select value={googleMapsData.limit} onValueChange={(value) => setGoogleMapsData(prev => ({ ...prev, limit: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 resultados</SelectItem>
                    <SelectItem value="50">50 resultados</SelectItem>
                    <SelectItem value="100">100 resultados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleGoogleMapsImport} disabled={loading} className="w-full">
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Extrair do Google Maps
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
