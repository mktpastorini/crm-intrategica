import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Filter, Search, Users as UsersIcon, Upload, Download } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import LeadsTable from '@/components/leads/LeadsTable';
import UserSelector from '@/components/leads/UserSelector';
import ImportLeadsDialog from '@/components/leads/ImportLeadsDialog';
import ExportLeadsDialog from '@/components/leads/ExportLeadsDialog';
import MultipleContacts from '@/components/leads/MultipleContacts';
import LeadsBulkActions from '@/components/leads/LeadsBulkActions';
import { usePhoneMask } from '@/hooks/usePhoneMask';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLeadContacts } from '@/hooks/useLeadContacts';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  position?: string;
}

export default function Leads() {
  const { leads, users, loading, actionLoading, createLead, updateLead, deleteLead, loadLeads, loadUsers, pipelineStages } = useCrm();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { handlePhoneChange } = usePhoneMask();
  const isMobile = useIsMobile();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const { saveContacts } = useLeadContacts();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    niche: '',
    status: 'novo',
    responsible_id: user?.id || '',
    website: '',
    address: '',
    whatsapp: '',
    instagram: ''
  });

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Atualizar o responsável padrão quando o usuário for carregado
  useEffect(() => {
    if (user?.id && !editingLead) {
      setFormData(prev => ({ ...prev, responsible_id: user.id }));
    }
  }, [user?.id, editingLead]);

  const getUserName = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    return foundUser?.name || 'Não atribuído';
  };

  const handleToggleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedLeads([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações básicas
      if (!formData.name.trim()) {
        toast({
          title: "Erro de validação",
          description: "Nome é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!formData.company.trim()) {
        toast({
          title: "Erro de validação",
          description: "Empresa é obrigatória",
          variant: "destructive",
        });
        return;
      }

      if (!formData.phone.trim()) {
        toast({
          title: "Erro de validação",
          description: "Telefone é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (!formData.niche.trim()) {
        toast({
          title: "Erro de validação",
          description: "Nicho é obrigatório",
          variant: "destructive",
        });
        return;
      }

      const submitData = {
        ...formData,
        name: formData.name.trim(),
        company: formData.company.trim(),
        phone: formData.phone.trim(),
        niche: formData.niche.trim(),
        email: formData.email.trim() || undefined,
        website: formData.website.trim() || undefined,
        address: formData.address.trim() || undefined,
        instagram: formData.instagram.trim() || undefined,
        whatsapp: formData.whatsapp.trim() || formData.phone.trim(),
        responsible_id: formData.responsible_id || user?.id || '',
      };

      console.log('Dados que serão enviados:', submitData);

      let leadId: string;

      if (editingLead) {
        console.log('Editando lead existente:', editingLead.id);
        await updateLead(editingLead.id, submitData);
        leadId = editingLead.id;
        
        if (profile?.role !== 'comercial') {
          toast({
            title: "Lead atualizado",
            description: "Lead foi atualizado com sucesso",
          });
        }
      } else {
        // Para criação, precisamos criar o lead diretamente no banco para obter o ID
        const { data: newLead, error } = await supabase
          .from('leads')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;
        
        leadId = newLead.id;
        
        // Recarregar a lista de leads
        await loadLeads();
        
        toast({
          title: "Lead criado",
          description: "Lead foi criado com sucesso",
        });
      }

      // Salvar contatos adicionais se houver
      if (contacts.length > 0) {
        try {
          await saveContacts(leadId, contacts);
        } catch (error) {
          console.error('Erro ao salvar contatos:', error);
          toast({
            title: "Aviso",
            description: "Lead salvo, mas houve erro ao salvar contatos adicionais",
            variant: "destructive",
          });
        }
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      
      let errorMessage = "Ocorreu um erro ao salvar o lead. Tente novamente.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (lead: any) => {
    console.log('Editando lead:', lead.name, 'User role:', profile?.role);
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
      whatsapp: lead.whatsapp || '',
      instagram: lead.instagram || ''
    });

    // Carregar contatos adicionais da nova tabela
    try {
      const { data, error } = await supabase
        .from('lead_contacts')
        .select('*')
        .eq('lead_id', lead.id);

      if (error) throw error;

      const loadedContacts = (data || []).map(contact => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        position: contact.position || ''
      }));

      setContacts(loadedContacts);
    } catch (error) {
      console.error('Erro ao carregar contatos adicionais:', error);
      setContacts([]);
    }

    setShowAddDialog(true);
  };

  const handleDelete = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    console.log('Excluindo lead:', lead?.name, 'User role:', profile?.role);
    
    try {
      await deleteLead(leadId);
      
      // Remover da seleção se estiver selecionado
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
      
      if (profile?.role !== 'comercial') {
        toast({
          title: "Lead excluído",
          description: "Lead foi excluído com sucesso",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingLead(null);
    setContacts([]);
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      niche: '',
      status: 'novo',
      responsible_id: user?.id || '',
      website: '',
      address: '',
      whatsapp: '',
      instagram: ''
    });
  };

  const handleImportLeads = async (importedLeads: any[]) => {
    try {
      console.log('Iniciando importação de leads com usuário:', user?.id);
      
      if (!user?.id) {
        toast({
          title: "Erro na importação",
          description: "Você precisa estar logado para importar leads.",
          variant: "destructive",
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const lead of importedLeads) {
        try {
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
            responsible_id: user.id
          };
          
          console.log('Criando lead importado com responsible_id:', user.id, leadData);
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
          description: `${successCount} leads importados com sucesso${errorCount > 0 ? ` (${errorCount} falharam)` : ''} e vinculados a você`,
        });
        
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
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} ${isMobile ? 'items-start' : 'items-center justify-between'} gap-4`}>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leads</h2>
          <p className="text-slate-600">Gerencie seus contatos e oportunidades</p>
        </div>
        <div className={`flex ${isMobile ? 'flex-col w-full' : 'flex-row'} gap-2`}>
          <Button 
            variant="outline" 
            onClick={() => setShowImportDialog(true)}
            className={isMobile ? 'w-full' : ''}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar em Massa
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowExportDialog(true)}
            className={isMobile ? 'w-full' : ''}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className={isMobile ? 'w-full' : ''}>
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Lead
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 items-end`}>
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
            <div className={isMobile ? 'w-full' : ''}>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={isMobile ? 'w-full' : 'w-48'}>
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
              className={isMobile ? 'w-full' : ''}
            >
              <Filter className="w-4 h-4" />
              {isMobile && <span className="ml-2">Limpar Filtros</span>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Ações em lote */}
      <LeadsBulkActions
        selectedLeads={selectedLeads}
        onClearSelection={handleClearSelection}
        users={users}
      />

      {/* Tabela de Leads */}
      {filteredLeads.length > 0 ? (
        <LeadsTable
          leads={filteredLeads}
          onEditLead={handleEdit}
          onDeleteLead={handleDelete}
          actionLoading={actionLoading}
          getUserName={getUserName}
          selectedLeads={selectedLeads}
          onToggleSelectLead={handleToggleSelectLead}
          onToggleSelectAll={handleToggleSelectAll}
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

      <ExportLeadsDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        leads={leads}
        users={users}
        pipelineStages={pipelineStages}
      />

      {/* Dialog de criação/edição */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogTrigger asChild>
          <Button className={isMobile ? 'w-full' : ''}>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </DialogTrigger>
        <DialogContent className={`${isMobile ? 'w-[95vw] max-w-none mx-2' : 'max-w-4xl'} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
            <DialogDescription>
              {editingLead ? 'Edite as informações do lead' : 'Adicione um novo lead ao sistema'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome do Contato <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="mt-1"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-sm font-medium">
                  Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  required
                  className="mt-1"
                  placeholder="Nome da empresa"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, (value) => setFormData(prev => ({ ...prev, phone: value })))}
                  required
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => handlePhoneChange(e.target.value, (value) => setFormData(prev => ({ ...prev, whatsapp: value })))}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="instagram" className="text-sm font-medium">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@usuario ou link"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://exemplo.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-sm font-medium">Endereço</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço completo da empresa"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="niche" className="text-sm font-medium">
                  Nicho <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                  required
                  className="mt-1"
                  placeholder="Ex: Saúde, Tecnologia..."
                />
              </div>
              <div>
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="mt-1">
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
            </div>

            <UserSelector
              users={users}
              value={formData.responsible_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, responsible_id: value }))}
              placeholder="Selecionar responsável"
            />

            <Separator className="my-6" />

            <MultipleContacts
              contacts={contacts}
              onChange={setContacts}
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
  );
}
