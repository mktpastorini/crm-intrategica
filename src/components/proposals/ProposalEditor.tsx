
import { useState, useEffect, useRef } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bold, Italic, Underline, List, ListOrdered, Plus, Tag, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProposalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProposal?: any;
}

export default function ProposalEditor({ open, onOpenChange, editingProposal }: ProposalEditorProps) {
  const { addProposal, updateProposal, actionLoading, leads, productsServices } = useCrm();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    total_value: ''
  });

  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showProductMenu, setShowProductMenu] = useState(false);

  useEffect(() => {
    if (editingProposal) {
      setFormData({
        title: editingProposal.title || '',
        content: editingProposal.content || '',
        total_value: editingProposal.total_value?.toString() || ''
      });
    } else {
      setFormData({
        title: '',
        content: '',
        total_value: ''
      });
    }
  }, [editingProposal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const totalValue = parseFloat(formData.total_value) || 0;

    try {
      const proposalData = {
        title: formData.title,
        content: formData.content,
        total_value: totalValue
      };

      if (editingProposal) {
        await updateProposal(editingProposal.id, proposalData);
      } else {
        await addProposal(proposalData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
    }
  };

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    const newContent = currentContent.substring(0, start) + `{{${tag}}}` + currentContent.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Focus back to textarea and position cursor
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + tag.length + 4; // 4 for the {{}}
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
    
    setShowTagMenu(false);
  };

  const insertProduct = (product: any) => {
    const productText = `\n\n**${product.name}** - ${formatCurrency(product.price)}\n${product.description || ''}\n`;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    const newContent = currentContent.substring(0, start) + productText + currentContent.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Update total value
    const currentTotal = parseFloat(formData.total_value) || 0;
    setFormData(prev => ({ 
      ...prev, 
      total_value: (currentTotal + product.price).toString()
    }));
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + productText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
    
    setShowProductMenu(false);
  };

  const applyFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'numbered':
        formattedText = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = formData.content.substring(0, start) + formattedText + formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const leadTags = [
    { label: 'Nome do Lead', value: 'LEAD_NAME' },
    { label: 'Telefone', value: 'LEAD_PHONE' },
    { label: 'Email', value: 'LEAD_EMAIL' },
    { label: 'Empresa', value: 'LEAD_COMPANY' },
    { label: 'Endereço', value: 'LEAD_ADDRESS' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} onClose={() => onOpenChange(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProposal ? 'Editar Proposta' : 'Criar Nova Proposta'}
          </DialogTitle>
          <DialogDescription>
            Use as ferramentas de edição e tags para personalizar sua proposta
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título da Proposta *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da proposta"
              required
            />
          </div>

          <div>
            <Label htmlFor="total_value">Valor Total (R$)</Label>
            <Input
              id="total_value"
              type="number"
              step="0.01"
              min="0"
              value={formData.total_value}
              onChange={(e) => setFormData(prev => ({ ...prev, total_value: e.target.value }))}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label>Conteúdo da Proposta *</Label>
            
            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-t-md">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting('bold')}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting('italic')}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting('underline')}
              >
                <Underline className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFormatting('numbered')}
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
              
              <div className="h-6 w-px bg-slate-300 mx-2" />
              
              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTagMenu(!showTagMenu)}
                >
                  <Tag className="w-4 h-4 mr-1" />
                  Tags
                </Button>
                {showTagMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 min-w-[200px]">
                    {leadTags.map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
                        onClick={() => insertTag(tag.value)}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProductMenu(!showProductMenu)}
                >
                  <Package className="w-4 h-4 mr-1" />
                  Produtos/Serviços
                </Button>
                {showProductMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 min-w-[250px] max-h-[200px] overflow-y-auto">
                    {productsServices.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">
                        Nenhum produto/serviço cadastrado
                      </div>
                    ) : (
                      productsServices.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0"
                          onClick={() => insertProduct(product)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-slate-500">
                            {formatCurrency(product.price)} - {product.type === 'product' ? 'Produto' : 'Serviço'}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Digite o conteúdo da proposta. Use as tags para inserir informações do lead automaticamente."
              className="w-full h-64 p-3 border border-slate-200 rounded-b-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="text-sm text-slate-600">
            <p className="font-medium mb-2">Tags disponíveis:</p>
            <div className="flex flex-wrap gap-1">
              {leadTags.map((tag) => (
                <Badge key={tag.value} variant="outline" className="text-xs">
                  {`{{${tag.value}}}`}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={actionLoading !== null}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={actionLoading !== null}
            >
              {editingProposal ? 'Salvar Alterações' : 'Criar Proposta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
