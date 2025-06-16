
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Building, Phone, MapPin, Plus, DollarSign } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: 'product' | 'service';
}

interface ProposalEditorProps {
  content: string;
  onChange: (content: string) => void;
  leads: Lead[];
  products: Product[];
}

export default function ProposalEditor({ content, onChange, leads, products }: ProposalEditorProps) {
  const [showLeadTags, setShowLeadTags] = useState(false);
  const [showProducts, setShowProducts] = useState(false);

  const insertTag = (tag: string) => {
    const newContent = content + tag;
    onChange(newContent);
    setShowLeadTags(false);
  };

  const insertProduct = (product: Product) => {
    const productText = `
${product.name} - R$ ${product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${product.description || ''}
`;
    const newContent = content + productText;
    onChange(newContent);
    setShowProducts(false);
  };

  const leadTags = [
    { label: 'Nome do Lead', tag: '[NOME_LEAD]' },
    { label: 'Telefone', tag: '[TELEFONE_LEAD]' },
    { label: 'Empresa', tag: '[EMPRESA_LEAD]' },
    { label: 'Endereço', tag: '[ENDERECO_LEAD]' },
    { label: 'Email', tag: '[EMAIL_LEAD]' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLeadTags(true)}
        >
          <User className="w-4 h-4 mr-2" />
          Inserir Tags do Lead
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowProducts(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto/Serviço
        </Button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Conteúdo da Proposta
        </label>
        <Textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite o conteúdo da proposta aqui. Use as tags para inserir informações do lead automaticamente."
          className="min-h-[300px] font-mono text-sm"
        />
      </div>

      {/* Dialog para Tags do Lead */}
      <Dialog open={showLeadTags} onOpenChange={setShowLeadTags}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Tags do Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Clique em uma tag para adicioná-la ao texto da proposta:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {leadTags.map((item) => (
                <Button
                  key={item.tag}
                  variant="outline"
                  className="justify-start h-auto p-3"
                  onClick={() => insertTag(item.tag)}
                >
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-slate-500 font-mono">{item.tag}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Produtos/Serviços */}
      <Dialog open={showProducts} onOpenChange={setShowProducts}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Produto/Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Selecione um produto ou serviço para adicionar à proposta:
            </p>
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => insertProduct(product)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-medium">
                        {product.name}
                      </CardTitle>
                      <Badge variant={product.type === 'product' ? 'default' : 'secondary'}>
                        {product.type === 'product' ? 'Produto' : 'Serviço'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {product.description && (
                      <p className="text-sm text-slate-600 mb-2">{product.description}</p>
                    )}
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                      <span className="font-semibold text-green-600">
                        R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {products.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Nenhum produto/serviço cadastrado
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
