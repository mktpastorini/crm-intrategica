
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageSquare, Users, Search, Save, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  company: string;
  niche: string;
  status: string;
  pipeline_stage?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

export default function Messages() {
  const { user, profile } = useAuth();
  const { settings } = useSystemSettingsDB();
  const { leads, loading: leadsLoading } = useCrm();
  const { toast } = useToast();
  
  const [message, setMessage] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Carregar templates salvos
  useEffect(() => {
    const savedTemplates = localStorage.getItem('messageTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Filtrar leads baseado na busca e nicho
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesNiche = !selectedNiche || lead.niche === selectedNiche;
    
    return matchesSearch && matchesNiche;
  });

  // Obter nichos únicos
  const uniqueNiches = Array.from(new Set(leads.map(lead => lead.niche))).filter(Boolean);

  const handleLeadSelection = (leadId: string, checked: boolean) => {
    setSelectedLeads(prev => {
      if (checked) {
        return [...prev, leadId];
      } else {
        return prev.filter(id => id !== leadId);
      }
    });
  };

  const selectAllFilteredLeads = () => {
    setSelectedLeads(filteredLeads.map(lead => lead.id));
  };

  const selectByNiche = (niche: string) => {
    const leadsInNiche = leads.filter(lead => lead.niche === niche);
    setSelectedLeads(leadsInNiche.map(lead => lead.id));
  };

  const clearSelection = () => {
    setSelectedLeads([]);
  };

  const saveTemplate = () => {
    if (!templateName.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do template e mensagem são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const newTemplate: MessageTemplate = {
      id: crypto.randomUUID(),
      name: templateName.trim(),
      message: message.trim(),
      created_at: new Date().toISOString()
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    localStorage.setItem('messageTemplates', JSON.stringify(updatedTemplates));
    
    setTemplateName('');
    setShowSaveTemplate(false);
    
    toast({
      title: "Template salvo",
      description: "Template de mensagem salvo com sucesso",
    });
  };

  const loadTemplate = (template: MessageTemplate) => {
    setMessage(template.message);
    toast({
      title: "Template carregado",
      description: `Template "${template.name}" carregado`,
    });
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(updatedTemplates);
    localStorage.setItem('messageTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template excluído",
      description: "Template removido com sucesso",
    });
  };

  const sendMessage = async () => {
    if (!settings.messageWebhookUrl) {
      toast({
        title: "Webhook não configurado",
        description: "Configure o webhook de mensagens nas configurações antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (selectedLeads.length === 0) {
      toast({
        title: "Nenhum lead selecionado",
        description: "Selecione pelo menos um lead para enviar a mensagem",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem antes de enviar",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      console.log('Enviando mensagem para leads via webhook:', settings.messageWebhookUrl);

      const selectedLeadsData = leads.filter(lead => selectedLeads.includes(lead.id));
      
      const webhookData = {
        message: message.trim(),
        leads: selectedLeadsData,
        sender: {
          id: user?.id,
          name: profile?.name,
          email: user?.email,
          role: profile?.role
        },
        timestamp: new Date().toISOString(),
        total_leads: selectedLeads.length
      };

      console.log('Dados do webhook para leads:', webhookData);

      const response = await fetch(settings.messageWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada para ${selectedLeads.length} lead(s) via webhook`,
      });

      // Limpar formulário
      setMessage('');
      setSelectedLeads([]);

    } catch (error: any) {
      console.error('Erro ao enviar webhook:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Verifique a configuração do webhook e tente novamente",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (leadsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando leads..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mensagens para Leads</h2>
        <p className="text-slate-600">Envie mensagens personalizadas para seus leads</p>
      </div>

      {!settings.messageWebhookUrl && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <p className="text-orange-800">
                <strong>Webhook não configurado:</strong> Configure o webhook de mensagens nas configurações para poder enviar mensagens.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seleção de Leads */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Selecionar Leads</span>
            </CardTitle>
            
            {/* Busca e Filtros */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, empresa ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por nicho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os nichos</SelectItem>
                  {uniqueNiches.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Botões de Seleção */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={selectAllFilteredLeads}>
                Todos Filtrados
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Limpar
              </Button>
              {selectedNiche && (
                <Button variant="outline" size="sm" onClick={() => selectByNiche(selectedNiche)}>
                  Todos do Nicho
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`lead-${lead.id}`}
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleLeadSelection(lead.id, !!checked)}
                  />
                  <label 
                    htmlFor={`lead-${lead.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-slate-600">
                        {lead.company} • {lead.niche}
                      </p>
                      <p className="text-xs text-slate-500">{lead.phone}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            
            {selectedLeads.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedLeads.length}</strong> lead(s) selecionado(s)
                </p>
              </div>
            )}
            
            {filteredLeads.length === 0 && (
              <p className="text-center text-slate-500 py-4">
                Nenhum lead encontrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Composição da Mensagem e Templates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Compor Mensagem</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Templates Salvos */}
            {templates.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Templates Salvos</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadTemplate(template)}
                        className="flex-1 justify-start text-left"
                      >
                        {template.name}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Área de Mensagem */}
            <div>
              <Textarea
                placeholder="Digite sua mensagem aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
            
            {/* Salvar Template */}
            <div className="space-y-2">
              {showSaveTemplate ? (
                <div className="flex space-x-2">
                  <Input
                    placeholder="Nome do template"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={saveTemplate} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setShowSaveTemplate(false)} size="sm">
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setShowSaveTemplate(true)}
                  disabled={!message.trim()}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar como Template
                </Button>
              )}
            </div>
            
            {/* Botão Enviar */}
            <Button 
              onClick={sendMessage}
              disabled={sending || !settings.messageWebhookUrl || selectedLeads.length === 0 || !message.trim()}
              className="w-full"
            >
              {sending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
            
            {!settings.messageWebhookUrl && (
              <p className="text-sm text-red-600 text-center">
                Configure o webhook de mensagens nas configurações para enviar
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {leads.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum lead cadastrado</h3>
            <p className="text-slate-600">Cadastre leads primeiro para poder enviar mensagens.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
