
import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, DollarSign, User, Building, Phone, MapPin } from 'lucide-react';
import ProposalEditor from '@/components/proposals/ProposalEditor';
import { supabase } from '@/integrations/supabase/client';

interface Proposal {
  id: string;
  title: string;
  content: string;
  total_value: number;
  lead_id?: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: 'product' | 'service';
  created_at: string;
  updated_at: string;
}

export default function Proposals() {
  const { leads } = useCrm();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'proposals' | 'products'>('proposals');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [newProposal, setNewProposal] = useState({
    title: '',
    content: '',
    total_value: 0
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'product' as 'product' | 'service'
  });

  useEffect(() => {
    loadProposals();
    loadProducts();
  }, []);

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProposals(data);
    } catch (error) {
      console.error('Erro ao carregar propostas:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        // Type cast the data to ensure proper typing
        const typedProducts: Product[] = data.map(item => ({
          ...item,
          type: item.type as 'product' | 'service'
        }));
        setProducts(typedProducts);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos/serviços:', error);
    }
  };

  const createProposal = async () => {
    if (!newProposal.title || !newProposal.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e conteúdo da proposta",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('proposals')
        .insert([newProposal])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setProposals(prev => [data, ...prev]);
        setNewProposal({ title: '', content: '', total_value: 0 });
        setShowProposalDialog(false);
        toast({
          title: "Proposta criada",
          description: "Proposta foi criada com sucesso"
        });
      }
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar proposta",
        variant: "destructive"
      });
    }
  };

  const createProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e preço do produto/serviço",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products_services')
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Type cast the response to ensure proper typing
        const typedProduct: Product = {
          ...data,
          type: data.type as 'product' | 'service'
        };
        setProducts(prev => [typedProduct, ...prev]);
        setNewProduct({ name: '', description: '', price: 0, type: 'product' });
        setShowProductDialog(false);
        toast({
          title: "Produto/Serviço criado",
          description: "Item foi criado com sucesso"
        });
      }
    } catch (error) {
      console.error('Erro ao criar produto/serviço:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar produto/serviço",
        variant: "destructive"
      });
    }
  };

  const linkProposalToLead = async (leadId: string) => {
    if (!selectedProposal) return;

    try {
      const { error: updateProposalError } = await supabase
        .from('proposals')
        .update({ lead_id: leadId })
        .eq('id', selectedProposal);

      if (updateProposalError) throw updateProposalError;

      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({ proposal_id: selectedProposal })
        .eq('id', leadId);

      if (updateLeadError) throw updateLeadError;

      setProposals(prev => prev.map(p => 
        p.id === selectedProposal ? { ...p, lead_id: leadId } : p
      ));

      setShowLinkDialog(false);
      setSelectedProposal(null);

      toast({
        title: "Proposta vinculada",
        description: "Proposta foi vinculada ao lead com sucesso"
      });
    } catch (error) {
      console.error('Erro ao vincular proposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao vincular proposta ao lead",
        variant: "destructive"
      });
    }
  };

  const getLinkedLead = (proposal: Proposal) => {
    return leads.find(lead => lead.id === proposal.lead_id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Propostas e Valores</h1>
          <p className="text-slate-600">Gerencie suas propostas e produtos/serviços</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'proposals'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Propostas
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'products'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Produtos/Serviços
        </button>
      </div>

      {/* Propostas Tab */}
      {activeTab === 'proposals' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Propostas</h2>
            <Button onClick={() => setShowProposalDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Proposta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proposals.map(proposal => {
              const linkedLead = getLinkedLead(proposal);
              return (
                <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-medium text-slate-900 flex-1">
                        {proposal.title}
                      </CardTitle>
                      <FileText className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Valor:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
                        <DollarSign className="w-3 h-3 mr-1" />
                        R$ {proposal.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                    </div>

                    {linkedLead ? (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center text-sm text-blue-800 mb-1">
                          <User className="w-3 h-3 mr-1" />
                          <span className="font-medium">Vinculado ao lead:</span>
                        </div>
                        <div className="text-sm text-blue-700">{linkedLead.name}</div>
                        <div className="text-xs text-blue-600">{linkedLead.company}</div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedProposal(proposal.id);
                          setShowLinkDialog(true);
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Adicionar ao Lead
                      </Button>
                    )}

                    <div className="text-xs text-slate-500">
                      Criado em {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Produtos/Serviços Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Produtos e Serviços</h2>
            <Button onClick={() => setShowProductDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-medium text-slate-900">
                      {product.name}
                    </CardTitle>
                    <Badge variant={product.type === 'product' ? 'default' : 'secondary'}>
                      {product.type === 'product' ? 'Produto' : 'Serviço'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.description && (
                    <p className="text-sm text-slate-600">{product.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Preço:</span>
                    <Badge variant="outline" className="font-semibold">
                      <DollarSign className="w-3 h-3 mr-1" />
                      R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500">
                    Criado em {new Date(product.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dialog para criar proposta */}
      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposal-title">Título da Proposta</Label>
              <Input
                id="proposal-title"
                value={newProposal.title}
                onChange={(e) => setNewProposal(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da proposta"
              />
            </div>

            <div>
              <Label htmlFor="proposal-value">Valor Total (R$)</Label>
              <Input
                id="proposal-value"
                type="number"
                step="0.01"
                value={newProposal.total_value}
                onChange={(e) => setNewProposal(prev => ({ ...prev, total_value: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </div>

            <ProposalEditor
              content={newProposal.content}
              onChange={(content) => setNewProposal(prev => ({ ...prev, content }))}
              leads={leads}
              products={products}
            />

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowProposalDialog(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={createProposal} className="flex-1">
                Criar Proposta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar produto/serviço */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Produto/Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-type">Tipo</Label>
              <Select value={newProduct.type} onValueChange={(value: 'product' | 'service') => 
                setNewProduct(prev => ({ ...prev, type: value }))
              }>
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
              <Label htmlFor="product-name">Nome</Label>
              <Input
                id="product-name"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do produto/serviço"
              />
            </div>

            <div>
              <Label htmlFor="product-description">Descrição</Label>
              <Textarea
                id="product-description"
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do produto/serviço"
              />
            </div>

            <div>
              <Label htmlFor="product-price">Preço (R$)</Label>
              <Input
                id="product-price"
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowProductDialog(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={createProduct} className="flex-1">
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para vincular proposta ao lead */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Proposta ao Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Selecione o Lead</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
                {leads.map(lead => (
                  <Card 
                    key={lead.id} 
                    className="p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => linkProposalToLead(lead.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{lead.name}</div>
                        <div className="text-xs text-slate-600 flex items-center mt-1">
                          <Building className="w-3 h-3 mr-1" />
                          {lead.company}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {lead.phone}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {lead.pipeline_stage}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)} className="w-full">
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
