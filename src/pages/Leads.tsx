
import { useState } from 'react';
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
import { Plus, Upload, Search, Edit, Trash2, Phone, Mail } from 'lucide-react';

export default function Leads() {
  const { leads, addLead, updateLead, deleteLead } = useCrm();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkData, setBulkData] = useState('');

  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    niche: '',
    status: 'Pendente',
    responsible: user?.email || ''
  });

  const niches = ['Tecnologia', 'Marketing', 'Saúde', 'Educação', 'E-commerce', 'Varejo'];
  const statuses = ['Pendente', 'Follow-up', 'Proposta Enviada', 'Perdido', 'Ganho'];

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLead = () => {
    if (!newLead.name || !newLead.company || !newLead.phone || !newLead.niche) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, Empresa, Telefone e Nicho são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    addLead(newLead);
    setNewLead({
      name: '',
      company: '',
      phone: '',
      email: '',
      niche: '',
      status: 'Pendente',
      responsible: user?.email || ''
    });
    setShowAddDialog(false);
    toast({
      title: "Lead adicionado",
      description: "Lead foi adicionado com sucesso ao pipeline",
    });
  };

  const handleBulkAdd = () => {
    if (!bulkData.trim()) return;

    const lines = bulkData.trim().split('\n');
    let addedCount = 0;

    lines.forEach(line => {
      const parts = line.split(',').map(part => part.trim());
      if (parts.length >= 3) {
        const [name, company, phone, email = ''] = parts;
        if (name && company && phone) {
          addLead({
            name,
            company,
            phone,
            email,
            niche: 'Tecnologia', // Default
            status: 'Pendente',
            responsible: user?.email || ''
          });
          addedCount++;
        }
      }
    });

    setBulkData('');
    setShowBulkDialog(false);
    toast({
      title: "Leads importados",
      description: `${addedCount} leads foram importados com sucesso`,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Leads</h2>
          <p className="text-slate-600">Gerencie todos os seus contatos comerciais</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
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
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowBulkDialog(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleBulkAdd} className="flex-1">
                    Importar
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
                  <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(47) 99999-9999"
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={newLead.status} onValueChange={(value) => setNewLead(prev => ({ ...prev, status: value }))}>
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
                  <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleAddLead} className="flex-1">
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {(user?.role === 'admin' || user?.role === 'supervisor') && (
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
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
