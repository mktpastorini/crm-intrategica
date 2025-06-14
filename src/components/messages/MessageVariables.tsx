
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Tag, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageVariable {
  tag: string;
  description: string;
  example: string;
}

const defaultVariables: MessageVariable[] = [
  { tag: '{{nome}}', description: 'Nome do contato', example: 'João Silva' },
  { tag: '{{empresa}}', description: 'Nome da empresa', example: 'Tech Solutions Ltda' },
  { tag: '{{email}}', description: 'Email do contato', example: 'joao@techsolutions.com' },
  { tag: '{{telefone}}', description: 'Telefone do contato', example: '(11) 99999-9999' },
  { tag: '{{whatsapp}}', description: 'WhatsApp do contato', example: '(11) 99999-9999' },
  { tag: '{{website}}', description: 'Website da empresa', example: 'www.techsolutions.com' },
  { tag: '{{endereco}}', description: 'Endereço da empresa', example: 'Rua das Flores, 123' },
  { tag: '{{nicho}}', description: 'Nicho/Segmento', example: 'Tecnologia' },
  { tag: '{{responsavel}}', description: 'Nome do responsável', example: 'Maria Santos' },
];

interface MessageVariablesProps {
  onInsertVariable?: (variable: string) => void;
}

export default function MessageVariables({ onInsertVariable }: MessageVariablesProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');
  const { toast } = useToast();

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({
      title: "Copiado!",
      description: `Variável ${variable} copiada para a área de transferência`,
    });
  };

  const handleInsertVariable = (variable: string) => {
    if (onInsertVariable) {
      onInsertVariable(variable);
    } else {
      setMessageTemplate(prev => prev + variable);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(messageTemplate);
    toast({
      title: "Template copiado!",
      description: "Template de mensagem copiado para a área de transferência",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Variáveis para Mensagens
        </CardTitle>
        <CardDescription>
          Use essas tags em suas mensagens. Elas serão substituídas automaticamente pelos dados do lead.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {defaultVariables.map((variable) => (
            <div key={variable.tag} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {variable.tag}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mt-1">{variable.description}</p>
                <p className="text-xs text-slate-400">Ex: {variable.example}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyVariable(variable.tag)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertVariable(variable.tag)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Tag className="w-4 h-4 mr-2" />
              Criar Template de Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Template de Mensagem</DialogTitle>
              <DialogDescription>
                Crie seu template usando as variáveis. Elas serão substituídas pelos dados reais do lead.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="template">Mensagem</Label>
                <Textarea
                  id="template"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Olá {{nome}}, somos da {{empresa}} e gostaríamos de apresentar nossa proposta..."
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Label className="w-full text-sm font-medium">Clique para inserir variáveis:</Label>
                {defaultVariables.map((variable) => (
                  <Button
                    key={variable.tag}
                    variant="outline"
                    size="sm"
                    onClick={() => handleInsertVariable(variable.tag)}
                    className="text-xs"
                  >
                    {variable.tag}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={copyTemplate} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Template
                </Button>
                <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
