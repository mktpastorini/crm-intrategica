
import { useState, useMemo } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Search, RefreshCw, Upload } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import LeadsTable from '@/components/leads/LeadsTable';

export default function Leads() {
  const { user } = useAuth();
  const { 
    leads, 
    loading, 
    actionLoading,
    createLead, 
    updateLead, 
    deleteLead 
  } = useCrm();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    niche: '',
    status: 'novo',
    pipeline_stage: 'aguardando-inicio',
    responsible_id: user?.id || ''
  });

  // Filtrar leads baseado na busca
  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    
    return leads.filter(lead => 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [leads, searchTerm]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = leads.length;
    const active = leads.filter(lead => ['novo', 'contatado', 'qualificado'].includes(lead.status)).length;
    const converted = leads.filter(lead => lead.status === 'fechado').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

    return { total, active, conversionRate };
  }, [leads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLead) {
        await updateLead(editingLead.id, formData);
      } else {
        // Sempre adicionar no primeiro estágio do pipeline
        await createLead({ 
          ...formData, 
          responsible_id: user?.id || '',
          pipeline_stage: 'aguardando-inicio'
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  };

  const handleEdit = (lead: any) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone,
      company: lead.company,
      niche: lead.niche,
      status: lead.status,
      pipeline_stage: lead.pipeline_stage || 'aguardando-inicio',
      responsible_id: lead.responsible_id
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    try {
      await deleteLead(leadId);
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingLead(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      niche: '',
      status: 'novo',
      pipeline_stage: 'aguardando-inicio',
      responsible_id: user?.id || ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando leads..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Leads</h2>
          <p className="text-slate-600">Gerencie todos os seus contatos comerciais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar em Massa
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
                <DialogDescription>
                  {editingLead ? 'Edite as informações do lead' : 'Adicione um novo lead ao sistema'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="niche">Nicho</Label>
                  <Input
                    id="niche"
                    value={formData.niche}
                    onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="contatado">Contatado</SelectItem>
                      <SelectItem value="qualificado">Qualificado</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={actionLoading === 'create-lead' || actionLoading === editingLead?.id}>
                    {(actionLoading === 'create-lead' || actionLoading === editingLead?.id) ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      editingLead ? 'Atualizar' : 'Criar Lead'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder="Buscar por nome, empresa, telefone ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Leads</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ativos</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-purple-600">{stats.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de leads */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Lista de Leads ({filteredLeads.length})
          </h3>
        </div>
        <LeadsTable
          leads={filteredLeads}
          onEditLead={handleEdit}
          onDeleteLead={handleDelete}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
}
