
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { proposalService, productServiceService } from '@/services/proposalService';
import { Proposal, ProductService } from '@/types/proposal';
import { Lead } from '@/components/pipeline/types';
import ProposalEditor from '@/components/proposals/ProposalEditor';
import ProposalList from '@/components/proposals/ProposalList';
import ProductServiceManager from '@/components/proposals/ProductServiceManager';
import { Plus, FileText, Package } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Proposals() {
  const [showProposalEditor, setShowProposalEditor] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar propostas
  const { data: proposals = [], refetch: refetchProposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: proposalService.getAll,
  });

  // Buscar produtos/serviços
  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ['products-services'],
    queryFn: productServiceService.getAll,
  });

  // Buscar leads
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleSaveProposal = async (proposalData: { title: string; content: string; total_value: number }) => {
    try {
      if (editingProposal) {
        await proposalService.update(editingProposal.id, proposalData);
        toast({
          title: "Sucesso",
          description: "Proposta atualizada com sucesso",
        });
      } else {
        await proposalService.create(proposalData);
        toast({
          title: "Sucesso",
          description: "Proposta criada com sucesso",
        });
      }
      
      setShowProposalEditor(false);
      setEditingProposal(null);
      refetchProposals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar proposta",
        variant: "destructive",
      });
    }
  };

  const handleEditProposal = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setShowProposalEditor(true);
  };

  const handleDeleteProposal = async (id: string) => {
    try {
      await proposalService.delete(id);
      refetchProposals();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir proposta",
        variant: "destructive",
      });
    }
  };

  const handleLinkToLead = async (proposalId: string, leadId: string) => {
    try {
      await proposalService.linkToLead(proposalId, leadId);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao vincular proposta ao lead",
        variant: "destructive",
      });
    }
  };

  const handleAddProduct = async (productData: Omit<ProductService, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await productServiceService.create(productData);
      refetchProducts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar produto/serviço",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<ProductService>) => {
    try {
      await productServiceService.update(id, updates);
      refetchProducts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar produto/serviço",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await productServiceService.delete(id);
      refetchProducts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir produto/serviço",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Propostas e Valores</h1>
      </div>

      <Tabs defaultValue="proposals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proposals" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Propostas</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Produtos/Serviços</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gerenciar Propostas</CardTitle>
                <Button onClick={() => setShowProposalEditor(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Proposta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ProposalList
                proposals={proposals}
                leads={leads}
                onEdit={handleEditProposal}
                onDelete={handleDeleteProposal}
                onLinkToLead={handleLinkToLead}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Produtos e Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductServiceManager
                products={products}
                onAdd={handleAddProduct}
                onUpdate={handleUpdateProduct}
                onDelete={handleDeleteProduct}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProposalEditor
        open={showProposalEditor}
        onOpenChange={setShowProposalEditor}
        onSave={handleSaveProposal}
        products={products}
        initialData={editingProposal ? {
          title: editingProposal.title,
          content: editingProposal.content,
          total_value: editingProposal.total_value
        } : undefined}
      />
    </div>
  );
}
