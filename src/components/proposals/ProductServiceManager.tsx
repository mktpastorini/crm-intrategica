
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ProductService } from '@/types/proposal';
import { Plus, Pencil, X, Package, Wrench } from 'lucide-react';

interface ProductServiceManagerProps {
  products: ProductService[];
  onAdd: (item: Omit<ProductService, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdate: (id: string, updates: Partial<ProductService>) => void;
  onDelete: (id: string) => void;
}

export default function ProductServiceManager({
  products,
  onAdd,
  onUpdate,
  onDelete
}: ProductServiceManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'product' as 'product' | 'service',
    price: 0,
    description: ''
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'product',
      price: 0,
      description: ''
    });
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (formData.price <= 0) {
      toast({
        title: "Erro",
        description: "Preço deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (editingItem) {
      onUpdate(editingItem.id, formData);
      toast({
        title: "Sucesso",
        description: `${formData.type === 'product' ? 'Produto' : 'Serviço'} atualizado com sucesso`,
      });
    } else {
      onAdd(formData);
      toast({
        title: "Sucesso",
        description: `${formData.type === 'product' ? 'Produto' : 'Serviço'} criado com sucesso`,
      });
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = (item: ProductService) => {
    setFormData({
      name: item.name,
      type: item.type,
      price: item.price,
      description: item.description || ''
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      onDelete(id);
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Produtos e Serviços</h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.type === 'product' ? (
                    <Package className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Wrench className="w-4 h-4 text-green-500" />
                  )}
                  <CardTitle className="text-sm">{item.name}</CardTitle>
                </div>
                <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                  {item.type === 'product' ? 'Produto' : 'Serviço'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-lg font-bold text-green-600">
                R$ {item.price.toFixed(2)}
              </div>
              {item.description && (
                <p className="text-sm text-slate-600 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="flex justify-end space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(item)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(item.id, item.name)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Adicionar'} Produto/Serviço
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto ou serviço"
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'product' | 'service') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Produto</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingItem ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
