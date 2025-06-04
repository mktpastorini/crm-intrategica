
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Phone, Mail, User, Building } from 'lucide-react';
import { useCrm } from '@/contexts/CrmContext';
import { Lead } from '@/types/crm';

export default function Leads() {
  const { toast } = useToast();
  const { leads, profiles, addLead, updateLead, deleteLead, loading } = useCrm();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    niche: '',
    status: 'novo',
    responsible_id: ''
  });

  const niches = [
    'Tecnologia', 'Saúde', 'Educação', 'Varejo', 'Serviços',
    'Indústria', 'Construção', 'Agricultura', 'Turismo', 'Outros'
  ];

  const statuses = [
    { value: 'novo', label: 'Novo', color: 'bg-blue-100 text-blue-800' },
    { value: 'contato', label: 'Contato Inicial', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'qualificado', label: 'Qualificado', color: 'bg-purple-100 text-purple-800' },
    { value: 'proposta', label: 'Proposta Enviada', color: 'bg-orange-100 text-orange-800' },
    { value: 'fechado', label: 'Fechado', color: 'bg-green-100 text-green-800' },
    { value: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800' }
  ];

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.company || !newLead.phone || !newLead.responsible_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    await addLead({
      name: newLead.name,
      company: newLead.company,
      phone: newLead.phone,
      email: newLead.email,
      niche: newLead.niche,
      status: newLead.status,
      responsible_id: newLead.responsible_id
    });

    setNewLead({ name: '', company: '', phone: '', email: '', niche: '', status: 'novo', responsible_id: '' });
    setShowAddDialog(false);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setNewLead({
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email || '',
      niche: lead.niche,
      status: lead.status,
      responsible_id: lead.responsible_id
    });
  };

  const handleUpdateLead = async () => {
    if (!editingLead || !newLead.name || !newLead.company || !newLead.phone || !newLead.responsible_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    await updateLead(editingLead.id, {
      name: newLead.name,
      company: newLead.company,
      phone: newLead.phone,
      email: newLead.email,
      niche: newLead.niche,
      status: newLead.status,
      responsible_id: newLead.responsible_id
    });

    setEditingLead(null);
    setNewLead({ name: '', company: '', phone: '', email: '', niche: '', status: 'novo', responsible_id: '' });
  };

  const handleDeleteLead = async (leadId: string) => {
    await deleteLead(leadId);
  };

  const getStatusColor = (status: string) => {
    return statuses.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return statuses.find(s => s.value === status)?.label || status;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Leads</h2>
          <p className="text-slate-600">Gerencie seus potenciais clientes</p>
        </div>
        <Dialog open={showAddDialog || !!editingLead} onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingLead(null);
            setNewLead({ name: '', company: '', phone: '', email: '', niche: '', status: 'novo', responsible_id: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLead ? 'Editar Lead' : 'Novo Lead'}
              </DialogTitle>
              <DialogDescription>
                {editingLead ? 'Atualize as informações do lead' : 'Adicione um novo lead ao sistema'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newLead.name}
                  onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do contato"
                />
              </div>
              <div>
                <Label htmlFor="company">Empresa *</Label>
                <Input
                  id="company"
                  value={newLead.company}
                  onChange={(e) => setNewLead(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
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
                />
              </div>
              <div>
                <Label htmlFor="niche">Nicho *</Label>
                <Select value={newLead.niche} onValueChange={(value) => setNewLead(prev => ({ ...prev, niche: value }))}>
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
                <Label htmlFor="status">Status *</Label>
                <Select value={newLead.status} onValueChange={(value) => setNewLead(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responsible">Responsável *</Label>
                <Select value={newLead.responsible_id} onValueChange={(value) => setNewLead(prev => ({ ...prev, responsible_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map(profile => (
                      <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingLead(null);
                    setNewLead({ name: '', company: '', phone: '', email: '', niche: '', status: 'novo', responsible_id: '' });
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={editingLead ? handleUpdateLead : handleAddLead} 
                  className="flex-1"
                >
                  {editingLead ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{leads.length}</div>
            <p className="text-sm text-blue-600">leads cadastrados</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-900">Qualificados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {leads.filter(l => l.status === 'qualificado').length}
            </div>
            <p className="text-sm text-green-600">prontos para proposta</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-900">Propostas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">
              {leads.filter(l => l.status === 'proposta').length}
            </div>
            <p className="text-sm text-orange-600">aguardando retorno</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-900">Fechados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {leads.filter(l => l.status === 'fechado').length}
            </div>
            <p className="text-sm text-purple-600">contratos assinados</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>Todos os leads cadastrados no sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-slate-700">Lead</th>
                  <th className="text-left p-4 font-medium text-slate-700">Empresa</th>
                  <th className="text-left p-4 font-medium text-slate-700">Contato</th>
                  <th className="text-left p-4 font-medium text-slate-700">Status</th>
                  <th className="text-left p-4 font-medium text-slate-700">Responsável</th>
                  <th className="text-left p-4 font-medium text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {lead.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{lead.name}</div>
                          <div className="text-sm text-slate-500">{lead.niche}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-slate-900">
                        <Building className="w-4 h-4 mr-2 text-slate-400" />
                        {lead.company}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-slate-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {lead.phone}
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
                      <Badge className={getStatusColor(lead.status)}>
                        {getStatusLabel(lead.status)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <User className="w-3 h-3 mr-1" />
                        {lead.responsible?.name || 'Não atribuído'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditLead(lead)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteLead(lead.id)}
                          className="text-red-600 hover:text-red-700"
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
    </div>
  );
}
