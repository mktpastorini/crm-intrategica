import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Search, Edit, Trash2, Phone, Mail, RefreshCw } from 'lucide-react';

export default function Leads() {
  const { 
    leads, 
    addLead, 
    updateLead, 
    deleteLead, 
    requestLeadEdit, 
    requestLeadDelete, 
    users, 
    loading,
    refreshData
  } = useCrm();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [editingLead, setEditingLead] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    niche: '',
    status: 'Pendente',
    responsible: profile?.name || user?.email || '',
    responsible_id: user?.id || ''
  });

  const niches = ['Tecnologia', 'Marketing', 'Saúde', 'Educação', 'E-commerce', 'Varejo'];
  const statuses = ['Pendente', 'Follow-up', 'Proposta Enviada', 'Perdido', 'Ganho'];

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.company || !newLead.phone || !newLead.niche) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, Empresa, Telefone e Nicho são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await addLead({
        name: newLead.name,
        company: newLead.company,
        phone: newLead.phone,
        email: newLead.email,
        niche: newLead.niche,
        status: newLead.status,
        responsible: newLead.responsible,
        responsible_id: newLead.responsible_id
      });
      
      setNewLead({
        name: '',
        company: '',
        phone: '',
        email: '',
        niche: '',
        status: 'Pendente',
        responsible: profile?.name || user?.email || '',
        responsible_id: user?.id || ''
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLead = (lead: any) => {
    setEditingLead({ ...lead });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;

    setSubmitting(true);
    try {
      if (profile?.role === 'admin' || profile?.role === 'supervisor') {
        await updateLead(editingLead.id, editingLead);
      } else {
        requestLeadEdit(editingLead.id, editingLead, user?.email || '');
      }
      
      setShowEditDialog(false);
      setEditingLead(null);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    if (profile?.role === 'admin' || profile?.role === 'supervisor') {
      await deleteLead(leadId);
    } else {
      requestLeadDelete(leadId, user?.email || '');
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkData.trim()) return;

    const lines = bulkData.trim().split('\n');
    let addedCount = 0;
    setSubmitting(true);

    try {
      for (const line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 3) {
          const [name, company, phone, email = ''] = parts;
          if (name && company && phone) {
            await addLead({
              name,
              company,
              phone,
              email,
              niche: 'Tecnologia',
              status: 'Pendente',
              responsible: profile?.name || user?.email || '',
              responsible_id: user?.id || ''
            });
            addedCount++;
          }
        }
      }

      setBulkData('');
      setShowBulkDialog(false);
      toast({
        title: "Leads importados",
        description: `${addedCount} leads foram importados com sucesso`,
      });
    } catch (error) {
      console.error('Erro na importação em massa:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    await refreshData();
    toast({
      title: "Dados atualizados",
      description: "Os dados foram recarregados do banco de dados",
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pendente': 'bg-yellow-100 text-yellow-800',
      'Follow-up': 'bg-blue-100 text-blue-800',
      'Proposta Enviada': 'bg-purple-100 text-purple-800',
      'Perdido': 'bg-red-100 text-red-800',
      'Ganho': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Carregando leads do banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Leads</h2>
          <p className="text-slate-600">Gerencie todos os seus contatos comerciais</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          
          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Importar em Massa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Importar Leads em Massa</DialogTitle>
                <DialogDescription>
                  Cole os dados dos leads no formato: nome,empresa,telefone,email (um por linha)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-data">Dados dos Leads</Label>
                  <textarea
                    id="bulk-data"
                    className="w-full h-32 p-3 border border-slate-300 rounded-md resize-none"
                    placeholder="João Silva,Empresa ABC,47999888777,joao@abc.com&#10;Maria Santos,XYZ Ltda,47888777666,maria@xyz.com"
                    value={bulkData}
                    onChange={(e) => setBulkData(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBulkDialog(false)} 
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleBulkAdd} 
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Importando...' : 'Importar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Lead</DialogTitle>
                <DialogDescription>
                  Adicione um novo lead ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newLead.name}
                    onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa *</Label>
                  <Input
                    id="company"
                    value={newLead.company}
                    onChange={(e) => setNewLead(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nome da empresa"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(47) 99999-9999"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@empresa.com"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="niche">Nicho *</Label>
                  <Select 
                    value={newLead.niche} 
                    onValueChange={(value) => setNewLead(prev => ({ ...prev, niche: value }))}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nicho" />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map(niche => (
                        <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newLead.status} 
                    onValueChange={(value) => setNewLead(prev => ({ ...prev, status: value }))}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)} 
                    className="flex-1"
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleAddLead} 
                    className="flex-1"
                    disabled={submitting}
                  >
                    {submitting ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={editingLead.name}
                  onChange={(e) => setEditingLead(prev => ({ ...prev, name: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-company">Empresa *</Label>
                <Input
                  id="edit-company"
                  value={editingLead.company}
                  onChange={(e) => setEditingLead(prev => ({ ...prev, company: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Telefone/WhatsApp *</Label>
                <Input
                  id="edit-phone"
                  value={editingLead.phone}
                  onChange={(e) => setEditingLead(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">E-mail</Label>
                <Input
                  id="edit-email"
                  value={editingLead.email || ''}
                  onChange={(e) => setEditingLead(prev => ({ ...prev, email: e.target.value }))}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="edit-niche">Nicho *</Label>
                <Select 
                  value={editingLead.niche} 
                  onValueChange={(value) => setEditingLead(prev => ({ ...prev, niche: value }))}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {niches.map(niche => (
                      <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editingLead.status} 
                  onValueChange={(value) => setEditingLead(prev => ({ ...prev, status: value }))}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)} 
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEdit} 
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, empresa, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{leads.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-900">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {leads.filter(lead => !['Perdido', 'Ganho'].includes(lead.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-900">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {leads.length > 0 ? Math.round((leads.filter(lead => lead.status === 'Ganho').length / leads.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-700">Nome</th>
                  <th className="text-left p-4 font-medium text-slate-700">Empresa</th>
                  <th className="text-left p-4 font-medium text-slate-700">Contato</th>
                  <th className="text-left p-4 font-medium text-slate-700">Nicho</th>
                  <th className="text-left p-4 font-medium text-slate-700">Status</th>
                  <th className="text-left p-4 font-medium text-slate-700">Responsável</th>
                  <th className="text-left p-4 font-medium text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{lead.name}</div>
                      <div className="text-sm text-slate-500">
                        Criado em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-4 text-slate-900">{lead.company}</td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-slate-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {formatPhone(lead.phone)}
                        </div>
                        {lead.email && (
                          <div className="flex items-center text-sm text-slate-600">
                            <Mail className="w-3 h-3 mr-1" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{lead.niche}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{lead.responsible}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditLead(lead)}
                          disabled={submitting}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteLead(lead.id)}
                          disabled={submitting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredLeads.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-slate-400 mb-4">📊</div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum lead encontrado</h3>
            <p className="text-slate-600">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Comece adicionando um novo lead ao sistema.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
