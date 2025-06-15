
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCrm } from '@/contexts/CrmContext';
import { X, Plus, DollarSign } from 'lucide-react';

interface ProposalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProposal?: any;
}

export default function ProposalEditor({ open, onOpenChange, editingProposal }: ProposalEditorProps) {
  const { leads, productsServices, addProposal, updateProposal, actionLoading } = useCrm();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (editingProposal) {
      setTitle(editingProposal.title || '');
      setContent(editingProposal.content || '');
      setSelectedProducts([]);
    } else {
      setTitle('');
      setContent('');
      setSelectedProducts([]);
    }
  }, [editingProposal, open]);

  const handleClose = () => {
    onOpenChange(false);
    setTitle('');
    setContent('');
    setSelectedProducts([]);
  };

  const insertLeadTag = (field: string) => {
    const tag = `{lead.${field}}`;
    setContent(prev => prev + tag);
  };

  const addProductToProposal = (product: any) => {
    const newProduct = {
      ...product,
      quantity: 1,
      unit_price: product.price,
      total_price: product.price
    };
    setSelectedProducts(prev => [...prev, newProduct]);
  };

  const removeProductFromProposal = (index: number) => {
    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProductQuantity = (index: number, quantity: number) => {
    setSelectedProducts(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, quantity, total_price: item.unit_price * quantity }
        : item
    ));
  };

  const getTotalValue = () => {
    return selectedProducts.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    let finalContent = content;
    
    // Add selected products to content
    if (selectedProducts.length > 0) {
      finalContent += '\n\n--- PRODUTOS/SERVIÇOS ---\n';
      selectedProducts.forEach(item => {
        finalContent += `\n${item.name}`;
        if (item.description) finalContent += ` - ${item.description}`;
        finalContent += `\nQuantidade: ${item.quantity}`;
        finalContent += `\nValor unitário: R$ ${item.unit_price.toFixed(2)}`;
        finalContent += `\nValor total: R$ ${item.total_price.toFixed(2)}\n`;
      });
      finalContent += `\nVALOR TOTAL DA PROPOSTA: R$ ${getTotalValue().toFixed(2)}`;
    }

    const proposalData = {
      title: title.trim(),
      content: finalContent,
      total_value: getTotalValue()
    };

    if (editingProposal) {
      await updateProposal(editingProposal.id, proposalData);
    } else {
      await addProposal(proposalData);
    }

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProposal ? 'Editar Proposta' : 'Criar Nova Proposta'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Título da Proposta</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da proposta..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags de Lead</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {['nome', 'telefone', 'empresa', 'endereço', 'email'].map(field => (
                <Badge
                  key={field}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => insertLeadTag(field)}
                >
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Conteúdo da Proposta</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o conteúdo da proposta... Use as tags acima para inserir dados do lead automaticamente."
              rows={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Adicionar Produtos/Serviços</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {productsServices.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">R$ {item.price.toFixed(2)}</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addProductToProposal(item)}
                    disabled={selectedProducts.some(p => p.id === item.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Produtos/Serviços Selecionados</label>
              <div className="space-y-2 mb-4">
                {selectedProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">R$ {item.unit_price.toFixed(2)} cada</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <div className="font-medium text-green-600">
                        R$ {item.total_price.toFixed(2)}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeProductFromProposal(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end p-3 bg-green-50 rounded">
                <div className="flex items-center gap-2 text-lg font-bold text-green-700">
                  <DollarSign className="w-5 h-5" />
                  Total: R$ {getTotalValue().toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!title.trim() || actionLoading === 'create-proposal'}
            >
              {editingProposal ? 'Salvar Alterações' : 'Criar Proposta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
