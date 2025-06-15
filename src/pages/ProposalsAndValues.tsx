
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProductsServicesTab from '@/components/proposals/ProductsServicesTab';
import ProposalsTab from '@/components/proposals/ProposalsTab';
import ProposalEditor from '@/components/proposals/ProposalEditor';
import ProductServiceForm from '@/components/proposals/ProductServiceForm';

export default function ProposalsAndValues() {
  const [showProposalEditor, setShowProposalEditor] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Propostas e Valores</h1>
        <p className="text-slate-600">Gerencie produtos, serviços e propostas comerciais</p>
      </div>

      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proposals">Propostas</TabsTrigger>
          <TabsTrigger value="products-services">Produtos/Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Propostas</h2>
            <Button onClick={() => setShowProposalEditor(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Proposta
            </Button>
          </div>
          <ProposalsTab />
        </TabsContent>

        <TabsContent value="products-services" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Produtos e Serviços</h2>
            <Button onClick={() => setShowProductForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
          <ProductsServicesTab />
        </TabsContent>
      </Tabs>

      <ProposalEditor
        open={showProposalEditor}
        onOpenChange={setShowProposalEditor}
      />

      <ProductServiceForm
        open={showProductForm}
        onOpenChange={setShowProductForm}
      />
    </div>
  );
}
