
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ProductService } from '@/types/proposal';
import { User, Phone, Building, MapPin, Plus } from 'lucide-react';

interface ProposalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (proposal: { title: string; content: string; total_value: number }) => void;
  products: ProductService[];
  initialData?: { title: string; content: string; total_value: number };
}

export default function ProposalEditor({ 
  open, 
  onOpenChange, 
  onSave, 
  products, 
  initialData 
}: ProposalEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [totalValue, setTotalValue] = useState(initialData?.total_value || 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const insertTag = (tag: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + tag + content.substring(end);
      setContent(newContent);
      
      // Manter cursor após a tag inserida
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    }
  };

  const insertProduct = (product: ProductService) => {
    const productText = `\n\n${product.name} - R$ ${product.price.toFixed(2)}\n${product.description || ''}`;
    insertTag(productText);
    setTotalValue(prev => prev + product.price);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      total_value: totalValue
    });

    // Reset form
    setTitle('');
    setContent('');
    setTotalValue(0);
  };

  const leadTags = [
    { label: 'Nome do Lead', tag: '{{NOME_LEAD}}', icon: User },
    { label: 'Telefone', tag: '{{TELEFONE_LEAD}}', icon: Phone },
    { label: 'Empresa', tag: '{{EMPRESA_LEAD}}', icon: Building },
    { label: 'Endereço', tag: '{{ENDERECO_LEAD}}', icon: MapPin },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Proposta' : 'Criar Nova Proposta'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Proposta</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da proposta"
            />
          </div>

          <div>
            <Label htmlFor="value">Valor Total (R$)</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              value={totalValue}
              onChange={(e) => setTotalValue(Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label>Tags do Lead</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {leadTags.map((tag) => {
                const Icon = tag.icon;
                return (
                  <Badge
                    key={tag.tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-slate-100"
                    onClick={() => insertTag(tag.tag)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {tag.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Produtos/Serviços</Label>
            <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
              {products.map((product) => (
                <Badge
                  key={product.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-blue-100"
                  onClick={() => insertProduct(product)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {product.name} - R$ {product.price.toFixed(2)}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="content">Conteúdo da Proposta</Label>
            <Textarea
              ref={textareaRef}
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o conteúdo da proposta aqui..."
              rows={12}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {initialData ? 'Atualizar' : 'Criar'} Proposta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
