
import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Phone, Mail, MessageCircle } from 'lucide-react';

export default function Messages() {
  const { leads } = useCrm();
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [messageType, setMessageType] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [messageHistory, setMessageHistory] = useState<any[]>([]);

  useEffect(() => {
    loadMessageHistory();
  }, []);

  const loadMessageHistory = () => {
    const saved = localStorage.getItem('messageHistory');
    if (saved) {
      setMessageHistory(JSON.parse(saved));
    }
  };

  const saveMessageHistory = (newHistory: any[]) => {
    setMessageHistory(newHistory);
    localStorage.setItem('messageHistory', JSON.stringify(newHistory));
  };

  const handleSendMessage = () => {
    if (!selectedLead || !message.trim()) return;

    const lead = leads.find(l => l.id === selectedLead);
    if (!lead) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      leadId: selectedLead,
      leadName: lead.name,
      type: messageType,
      subject: messageType === 'email' ? subject : '',
      content: message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    const updatedHistory = [newMessage, ...messageHistory];
    saveMessageHistory(updatedHistory);

    // Reset form
    setMessage('');
    setSubject('');
    setSelectedLead('');
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'email': return <Mail className="w-4 h-4 text-blue-600" />;
      case 'sms': return <Phone className="w-4 h-4 text-orange-600" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getMessageBadgeColor = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'sms': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtrar leads com pipeline_stage válido
  const availableLeads = leads.filter(lead => lead.pipeline_stage && lead.pipeline_stage !== 'contrato-assinado');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Mensagens</h2>
        <p className="text-slate-600">Envie mensagens personalizadas para seus leads</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Enviar Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lead</label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lead" />
                </SelectTrigger>
                <SelectContent>
                  {availableLeads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Mensagem</label>
              <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {messageType === 'email' && (
              <div>
                <label className="block text-sm font-medium mb-2">Assunto</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Digite o assunto do e-mail"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Mensagem</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={6}
              />
            </div>

            <Button 
              onClick={handleSendMessage}
              disabled={!selectedLead || !message.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </Button>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {messageHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p>Nenhuma mensagem enviada ainda</p>
                </div>
              ) : (
                messageHistory.map((msg) => (
                  <div key={msg.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getMessageIcon(msg.type)}
                        <span className="font-medium">{msg.leadName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getMessageBadgeColor(msg.type)}>
                          {msg.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(msg.timestamp).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    {msg.subject && (
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        Assunto: {msg.subject}
                      </p>
                    )}
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
