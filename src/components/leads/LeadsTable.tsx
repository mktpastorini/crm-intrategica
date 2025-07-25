
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Phone, Mail, Globe, MapPin, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

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

interface LeadsTableProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  actionLoading: string | null;
  getUserName: (userId: string) => string;
  selectedLeads: string[];
  onToggleSelectLead: (leadId: string) => void;
  onToggleSelectAll: () => void;
}

export default function LeadsTable({ 
  leads, 
  onEditLead, 
  onDeleteLead, 
  actionLoading, 
  getUserName, 
  selectedLeads, 
  onToggleSelectLead, 
  onToggleSelectAll 
}: LeadsTableProps) {
  const { profile } = useAuth();
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'novo': return 'bg-blue-100 text-blue-800';
      case 'contatado': return 'bg-yellow-100 text-yellow-800';
      case 'qualificado': return 'bg-green-100 text-green-800';
      case 'proposta': return 'bg-purple-100 text-purple-800';
      case 'fechado': return 'bg-emerald-100 text-emerald-800';
      case 'perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'novo': 'novo',
      'contatado': 'Pendente',
      'qualificado': 'Login realizado',
      'proposta': 'proposta',
      'fechado': 'fechado',
      'perdido': 'perdido'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleEditLead = (lead: Lead) => {
    console.log('Clicando em editar lead:', lead.name, 'User role:', profile?.role);
    onEditLead(lead);
  };

  const handleDeleteLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    console.log('Clicando em excluir lead:', lead?.name, 'User role:', profile?.role);
    
    if (profile?.role === 'comercial') {
      console.log('Enviando solicitação de exclusão para aprovação');
      onDeleteLead(leadId);
    } else {
      if (!confirm('Tem certeza que deseja excluir este lead?')) return;
      onDeleteLead(leadId);
    }
  };

  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length;
  const isIndeterminate = selectedLeads.length > 0 && selectedLeads.length < leads.length;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onToggleSelectAll}
                    aria-label="Selecionar todos os leads"
                    className={isIndeterminate ? "data-[state=checked]:bg-primary/50" : ""}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Empresa/Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Nicho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Responsável
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => onToggleSelectLead(lead.id)}
                      aria-label={`Selecionar lead ${lead.company}`}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-slate-900">{lead.company}</div>
                        {lead.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-slate-600 font-medium">{lead.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">{lead.name}</div>
                      <div className="text-xs text-slate-500">
                        Criado em {formatDate(lead.created_at)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {lead.phone && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Phone className="w-3 h-3 mr-1 text-slate-400" />
                          <span className="font-medium">{lead.phone}</span>
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Mail className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-center">
                          <Globe className="w-3 h-3 mr-1 text-slate-400" />
                          <a 
                            href={lead.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Site
                          </a>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {lead.address && (
                      <div className="flex items-start gap-1 max-w-xs">
                        <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-600 leading-relaxed">{lead.address}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{lead.niche}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusBadgeColor(lead.status)}>
                      {getStatusLabel(lead.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{getUserName(lead.responsible_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLead(lead)}
                        className="h-8 w-8 p-0"
                        title={profile?.role === 'comercial' ? 'Solicitar edição' : 'Editar lead'}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLead(lead.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        disabled={actionLoading === lead.id}
                        title={profile?.role === 'comercial' ? 'Solicitar exclusão' : 'Excluir lead'}
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
  );
}
