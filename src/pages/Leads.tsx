import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, MoreHorizontal, Upload, Phone, Mail, Calendar, MessageSquare, Trash2, Edit, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import LeadDialog from '@/components/leads/LeadDialog';
import ImportLeadsDialog from '@/components/leads/ImportLeadsDialog';
import UserSelector from '@/components/leads/UserSelector';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp: string;
  status: string;
  created_at: string;
  responsible_id: string | null;
  last_contact: string | null;
  source: string;
  website: string;
  address: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function Leads() {
  const { toast } = useToast();
  const { settings } = useSystemSettingsDB();
  const { user, profile } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, searchTerm, statusFilter, responsibleFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('leads').select('*');
      
      // If user is not admin or supervisor, only show their leads
      if (profile?.role !== 'admin' && profile?.role !== 'supervisor') {
        query = query.eq('responsible_id', user?.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(term) || 
        lead.company.toLowerCase().includes(term) || 
        lead.email.toLowerCase().includes(term) ||
        lead.phone.includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }
    
    // Apply responsible filter
    if (responsibleFilter) {
      filtered = filtered.filter(lead => lead.responsible_id === responsibleFilter);
    }
    
    setFilteredLeads(filtered);
  };

  const handleCreateLead = async (leadData: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...leadData,
          created_at: new Date().toISOString(),
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      setLeads(prev => [data[0], ...prev]);
      
      toast({
        title: "Lead criado",
        description: "O lead foi criado com sucesso",
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o lead",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const handleUpdateLead = async (id: string, leadData: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', id)
        .select();
      
      if (error) {
        throw error;
      }
      
      setLeads(prev => prev.map(lead => lead.id === id ? data[0] : lead));
      
      toast({
        title: "Lead atualizado",
        description: "O lead foi atualizado com sucesso",
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lead",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setLeads(prev => prev.filter(lead => lead.id !== id));
      
      toast({
        title: "Lead excluído",
        description: "O lead foi excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lead",
        variant: "destructive",
      });
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const handleImportLeads = async (importedLeads: Partial<Lead>[]) => {
    try {
      const leadsWithTimestamp = importedLeads.map(lead => ({
        ...lead,
        created_at: new Date().toISOString(),
        status: 'novo'
      }));
      
      const { data, error } = await supabase
        .from('leads')
        .insert(leadsWithTimestamp)
        .select();
      
      if (error) {
        throw error;
      }
      
      fetchLeads();
      
      toast({
        title: "Leads importados",
        description: `${importedLeads.length} leads foram importados com sucesso`,
      });
    } catch (error) {
      console.error('Error importing leads:', error);
      toast({
        title: "Erro",
        description: "Não foi possível importar os leads",
        variant: "destructive",
      });
    }
  };

  const exportLeads = () => {
    const csvContent = [
      ['Nome', 'Empresa', 'Email', 'Telefone', 'WhatsApp', 'Status', 'Origem', 'Website', 'Endereço', 'Data de Criação'].join(','),
      ...filteredLeads.map(lead => [
        lead.name,
        lead.company,
        lead.email,
        lead.phone,
        lead.whatsapp,
        lead.status,
        lead.source,
        lead.website,
        lead.address,
        new Date(lead.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, className: string }> = {
      'novo': { label: 'Novo', className: 'bg-blue-100 text-blue-800' },
      'contato': { label: 'Em Contato', className: 'bg-yellow-100 text-yellow-800' },
      'qualificado': { label: 'Qualificado', className: 'bg-green-100 text-green-800' },
      'perdido': { label: 'Perdido', className: 'bg-red-100 text-red-800' },
      'convertido': { label: 'Convertido', className: 'bg-purple-100 text-purple-800' }
    };
    
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${statusInfo.className} capitalize`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getResponsibleName = (id: string | null) => {
    if (!id) return '-';
    const user = users.find(u => u.id === id);
    return user ? user.name : '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Leads</h2>
          <p className="text-slate-600">Gerencie seus leads e prospects</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-2 md:space-x-4">
          {/* Mobile: Buttons stacked vertically */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <Button
              onClick={() => setImportDialogOpen(true)}
              variant="outline"
              className="w-full md:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar em Massa
            </Button>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="w-full md:w-auto"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Buscar leads..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Tabs defaultValue="all" onValueChange={setStatusFilter}>
                <TabsList className="grid grid-cols-5 h-9">
                  <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                  <TabsTrigger value="novo" className="text-xs">Novos</TabsTrigger>
                  <TabsTrigger value="contato" className="text-xs">Em Contato</TabsTrigger>
                  <TabsTrigger value="qualificado" className="text-xs">Qualificados</TabsTrigger>
                  <TabsTrigger value="convertido" className="text-xs">Convertidos</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div>
              <UserSelector
                users={users}
                value={responsibleFilter}
                onValueChange={setResponsibleFilter}
                placeholder="Filtrar por responsável"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={exportLeads}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Carregando leads..." />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Nenhum lead encontrado</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchTerm || statusFilter !== 'all' || responsibleFilter ? 
                  'Tente ajustar os filtros' : 
                  'Clique em "Novo Lead" para adicionar um lead'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome / Empresa</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-slate-500">{lead.company}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {lead.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1 text-slate-400" />
                              <span>{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="w-3 h-3 mr-1 text-slate-400" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(lead.status)}
                      </TableCell>
                      <TableCell>
                        {getResponsibleName(lead.responsible_id)}
                      </TableCell>
                      <TableCell>
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              Agendar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteLead(lead.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <ImportLeadsDialog 
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportLeads}
      />

      {/* Create/Edit Lead Dialog */}
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editingLead}
        onSave={editingLead ? 
          (data) => handleUpdateLead(editingLead.id, data) : 
          handleCreateLead
        }
        onClose={() => setEditingLead(null)}
        users={users}
      />
    </div>
  );
}
