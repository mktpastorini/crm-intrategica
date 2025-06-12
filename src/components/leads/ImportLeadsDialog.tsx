
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (leads: any[]) => void;
}

export default function ImportLeadsDialog({ open, onOpenChange, onImport }: ImportLeadsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [importType, setImportType] = useState<'csv' | 'text'>('csv');
  const [textData, setTextData] = useState('');
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const leads = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const lead: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          
          // Map CSV headers to lead fields
          if (header.includes('nome') || header.includes('name')) {
            lead.name = value;
          } else if (header.includes('empresa') || header.includes('company')) {
            lead.company = value;
          } else if (header.includes('email')) {
            lead.email = value;
          } else if (header.includes('telefone') || header.includes('phone')) {
            lead.phone = value;
          } else if (header.includes('whatsapp')) {
            lead.whatsapp = value;
          } else if (header.includes('site') || header.includes('website')) {
            lead.website = value;
          } else if (header.includes('endereco') || header.includes('address')) {
            lead.address = value;
          }
        });
        
        return lead;
      }).filter(lead => lead.name || lead.email);

      onImport(leads);
      onOpenChange(false);
      
      toast({
        title: "Importação concluída",
        description: `${leads.length} leads foram importados com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo CSV",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextImport = () => {
    if (!textData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira os dados dos leads",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const lines = textData.split('\n').filter(line => line.trim());
      const leads = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        return {
          name: parts[0] || '',
          company: parts[1] || '',
          email: parts[2] || '',
          phone: parts[3] || ''
        };
      }).filter(lead => lead.name || lead.email);

      onImport(leads);
      onOpenChange(false);
      setTextData('');
      
      toast({
        title: "Importação concluída",
        description: `${leads.length} leads foram importados com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao processar texto:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "nome,empresa,email,telefone,whatsapp,website,endereco\nJoão Silva,Empresa ABC,joao@empresa.com,(11) 99999-9999,(11) 99999-9999,https://empresa.com,Rua Example 123";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_leads.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Leads em Massa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Import Type Selection */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant={importType === 'csv' ? 'default' : 'outline'}
              onClick={() => setImportType('csv')}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Arquivo CSV
            </Button>
            <Button
              variant={importType === 'text' ? 'default' : 'outline'}
              onClick={() => setImportType('text')}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Texto
            </Button>
          </div>

          {importType === 'csv' ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Upload de Arquivo CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Selecionar arquivo CSV</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
                
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                  <p className="font-medium mb-2">Formato esperado:</p>
                  <p>nome, empresa, email, telefone, whatsapp, website, endereco</p>
                </div>
                
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Importar via Texto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="text-data">Dados dos Leads</Label>
                  <Textarea
                    id="text-data"
                    placeholder="Exemplo:&#10;João Silva, Empresa ABC, joao@empresa.com, (11) 99999-9999&#10;Maria Santos, Empresa XYZ, maria@empresa.com, (11) 88888-8888"
                    value={textData}
                    onChange={(e) => setTextData(e.target.value)}
                    rows={8}
                    className="mt-1 text-sm"
                  />
                </div>
                
                <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Formato:</p>
                  <p>Nome, Empresa, Email, Telefone (um por linha)</p>
                </div>
                
                <Button
                  onClick={handleTextImport}
                  disabled={loading || !textData.trim()}
                  className="w-full"
                >
                  {loading ? <LoadingSpinner size="sm" /> : 'Importar Leads'}
                </Button>
              </CardContent>
            </Card>
          )}
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" text="Processando importação..." />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
