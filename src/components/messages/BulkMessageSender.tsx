
import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface BulkMessageSenderProps {
  onClose: () => void;
}

export default function BulkMessageSender({ onClose }: BulkMessageSenderProps) {
  const { leads, sendBulkMessage } = useCrm();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesStatus;
  });

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleLeadToggle = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const processMessage = (message: string, lead: any) => {
    return message
      .replace(/\{\{nome\}\}/g, lead.name || '')
      .replace(/\{\{empresa\}\}/g, lead.company || '')
      .replace(/\{\{email\}\}/g, lead.email || '')
      .replace(/\{\{telefone\}\}/g, lead.phone || '')
      .replace(/\{\{whatsapp\}\}/g, lead.whatsapp || '')
      .replace(/\{\{website\}\}/g, lead.website || '')
      .replace(/\{\{endereco\}\}/g, lead.address || '')
      .replace(/\{\{nicho\}\}/g, lead.niche || '');
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Erro de validação",
        description: "Mensagem é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (selectedLeads.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Selecione pelo menos um lead",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Process messages with variables for each lead
      const processedMessages = selectedLeads.map(leadId => {
        const lead = leads.find(l => l.id === leadId);
        return {
          leadId,
          message: lead ? processMessage(message, lead) : message,
          leadData: lead
        };
      });

      await sendBulkMessage(selectedLeads, message);

      onClose();
    } catch (error) {
      console.error('Erro ao enviar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueStatuses = [...new Set(leads.map(lead => lead.status))];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Envio em Massa de Mensagens
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Filtrar por Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Leads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">
              Leads Filtrados ({filteredLeads.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedLeads.length === filteredLeads.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
            {filteredLeads.map(lead => (
              <div key={lead.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={selectedLeads.includes(lead.id)}
                  onCheckedChange={() => handleLeadToggle(lead.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">{lead.name}</div>
                  <div className="text-sm text-slate-600">{lead.company}</div>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">{lead.status}</Badge>
                </div>
              </div>
            ))}
          </div>

          {selectedLeads.length > 0 && (
            <div className="mt-2 text-sm text-slate-600">
              {selectedLeads.length} lead(s) selecionado(s)
            </div>
          )}
        </div>

        {/* Mensagem */}
        <div>
          <label className="text-sm font-medium mb-2 block">Mensagem</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui... Use variáveis como {{nome}}, {{empresa}}, etc."
            rows={4}
          />
          <div className="mt-2 text-xs text-slate-500">
            Use variáveis como {`{{nome}}`}, {`{{empresa}}`}, {`{{email}}`}, etc. que serão substituídas pelos dados de cada lead.
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSend} 
            disabled={loading || selectedLeads.length === 0}
            className="flex-1"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar para {selectedLeads.length} lead(s)
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
