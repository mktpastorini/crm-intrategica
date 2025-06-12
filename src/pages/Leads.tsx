import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Filter, Search, Users as UsersIcon, Upload } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import LeadsTable from '@/components/leads/LeadsTable';
import UserSelector from '@/components/leads/UserSelector';
import ImportLeadsDialog from '@/components/leads/ImportLeadsDialog';
import { usePhoneMask } from '@/hooks/usePhoneMask';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company: string;
  niche: string;
  status: string;
  responsible_id: string;
  created_at: string;
  website?: string;
  address?: string;
  rating?: number;
  place_id?: string;
  whatsapp?: string;
}

export default function Leads() {
  const { leads, users, loading, actionLoading, createLead, updateLead, deleteLead, loadLeads, loadUsers } = useCrm();
  const { toast } = useToast();
  const { handlePhoneChange } = usePhoneMask();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    niche: '',
    status: 'novo',
    responsible_id: '',
    website: '',
    address: '',
    whatsapp: ''
  });

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Não atribuído';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        // Se o WhatsApp não foi preenchido, usa o telefone
        whatsapp: formData.whatsapp || formData.phone
      };

      if (editingLead) {
        await updateLead(editingLead.id, submitData);
        toast({
          title: "Lead atualizado",
          description: "Lead foi atualizado com sucesso",
        });
      } else {
        await createLead(submitData);
        toast({
          title: "Lead criado",
          description: "Lead foi criado com sucesso",
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      // Erro já tratado no contexto
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone,
      company: lead.company,
      niche: lead.niche,
      status: lead.status,
      responsible_id: lead.responsible_id,
      website: lead.website || '',
      address: lead.address || '',
      whatsapp: lead.whatsapp || ''
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    try {
      await deleteLead(leadId);
      toast({
        title: "Lead excluído",
        description: "Lead foi excluído com sucesso",
      });
    } catch (error) {
      // Erro já tratado no contexto
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
      responsible_id: '',
      website: '',
      address: '',
      whatsapp: ''
    });
  };

  const handleImportLeads = async (importedLeads: any[]) => {
    try {
      console.log('Iniciando importação de leads:', importedLeads);
      
      // Get the first available user as default responsible
      const defaultUser = users.length > 0 ? users[0] : null;
      
      if (!defaultUser) {
        toast({
          title: "Erro na importação",
          description: "Nenhum usuário disponível para atribuir os leads. Cadastre um usuário primeiro.",
          variant: "destructive",
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const lead of importedLeads) {
        try {
          // Ensure required fields are present
          const leadData = {
            name: lead.name || 'Nome não informado',
            company: lead.company || lead.name || 'Empresa não informada',
            phone: lead.phone || '',
            whatsapp: lead.whatsapp || lead.phone || '',
            email: lead.email || '',
            website: lead.website || '',
            address: lead.address || '',
            rating: lead.rating || null,
            place_id: lead.place_id || null,
            niche: lead.niche || 'Google Maps',
            status: lead.status || 'novo',
            responsible_id: lead.responsible_id || defaultUser.id
          };
          
          console.log('Criando lead:', leadData);
          await createLead(leadData);
          successCount++;
        } catch (error: any) {
          console.error('Erro ao criar lead individual:', error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${successCount} leads importados com sucesso${errorCount > 0 ? ` (${errorCount} falharam)` : ''}`,
        });
        
        // Recarregar a lista de leads
        await loadLeads();
      } else {
        toast({
          title: "Erro na importação",
          description: "Nenhum lead foi importado com sucesso",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar leads",
        variant: "destructive",
      });
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.website && lead.website.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.address && lead.address.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando leads..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leads</h2>
          <p className="text-slate-600">Gerencie seus contatos e oportunidades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar em Massa
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
                <DialogDescription>
                  {editingLead ? 'Edite as informações do lead' : 'Adicione um novo lead ao sistema'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Contato</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value, (value) => setFormData(prev => ({ ...prev, phone: value })))}
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => handlePhoneChange(e.target.value, (value) => setFormData(prev => ({ ...prev, whatsapp: value })))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website (opcional)</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Endereço (opcional)</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Endereço completo da empresa"
                    rows={2}
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
                <UserSelector
                  users={users}
                  value={formData.responsible_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_id: value }))}
                  placeholder="Selecionar responsável"
                />
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={actionLoading === 'create-lead' || actionLoading === 'submit'}>
                    {(actionLoading === 'create-lead' || actionLoading === 'submit') ? (
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

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Buscar por nome, empresa, telefone, email, site ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              size="icon"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{leads.length}</div>
            <p className="text-sm text-slate-600">Total de Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {leads.filter(l => l.status === 'novo').length}
            </div>
            <p className="text-sm text-slate-600">Novos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {leads.filter(l => l.status === 'qualificado').length}
            </div>
            <p className="text-sm text-slate-600">Qualificados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {leads.filter(l => l.status === 'fechado').length}
            </div>
            <p className="text-sm text-slate-600">Fechados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Leads */}
      {filteredLeads.length > 0 ? (
        <LeadsTable
          leads={filteredLeads}
          onEditLead={handleEdit}
          onDeleteLead={handleDelete}
          actionLoading={actionLoading}
          getUserName={getUserName}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </h3>
            <p className="text-slate-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece adicionando um novo lead ao sistema.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      <ImportLeadsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportLeads}
      />
    </div>
  );
}
