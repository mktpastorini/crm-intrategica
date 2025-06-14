
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Tag } from 'lucide-react';

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
];

interface MessageVariablesProps {
  onInsertVariable?: (variable: string) => void;
}

export default function MessageVariables({ onInsertVariable }: MessageVariablesProps) {
  const handleInsertVariable = (variable: string) => {
    if (onInsertVariable) {
      onInsertVariable(variable);
    }
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
              {onInsertVariable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertVariable(variable.tag)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
