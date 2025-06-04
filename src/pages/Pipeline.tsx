
import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, Calendar, User, Building, Archive } from 'lucide-react';

export default function Pipeline() {
  const { leads, pipelineStages, moveLead, addEvent } = useCrm();
  const { toast } = useToast();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [eventData, setEventData] = useState({
    type: 'reunion' as 'reunion' | 'call' | 'whatsapp' | 'email',
    date: '',
    time: '',
    responsible: ''
  });

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.pipelineStage !== newStage) {
      // Se movendo para estágio "reunião", abrir modal de agendamento
      if (newStage === 'reuniao') {
        setSelectedLead(leadId);
        setShowEventDialog(true);
        return;
      }
      
      moveLead(leadId, newStage);
      toast({
        title: "Lead movido",
        description: `${lead.name} foi movido para ${pipelineStages.find(s => s.id === newStage)?.name}`,
      });
    }
  };

  const handleScheduleEvent = () => {
    if (!selectedLead || !eventData.date || !eventData.time || !eventData.responsible) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para agendar o evento",
        variant: "destructive",
      });
      return;
    }

    const lead = leads.find(l => l.id === selectedLead);
    if (!lead) return;

    // Criar evento
    addEvent({
      title: `${eventData.type === 'reunion' ? 'Reunião' : 
              eventData.type === 'call' ? 'Telefonema' :
              eventData.type === 'whatsapp' ? 'WhatsApp' : 'E-mail'} - ${lead.name}`,
      leadName: lead.name,
      company: lead.company,
      date: eventData.date,
      time: eventData.time,
      responsible: eventData.responsible,
      type: eventData.type
    });

    // Mover lead para estágio reunião
    moveLead(selectedLead, 'reuniao');

    // Reset form
    setEventData({
      type: 'reunion',
      date: '',
      time: '',
      responsible: ''
    });
    setSelectedLead(null);
    setShowEventDialog(false);

    toast({
      title: "Evento agendado",
      description: "O evento foi criado e o lead foi movido para o estágio Reunião",
    });
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.pipelineStage === stageId);
  };

  const eventTypes = [
    { value: 'reunion', label: 'Reunião' },
    { value: 'call', label: 'Telefonema' },
    { value: 'whatsapp', label: 'Conversa no WhatsApp' },
    { value: 'email', label: 'E-mail' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Pipeline de Atendimento</h2>
        <p className="text-slate-600">Gerencie o fluxo de leads através do processo de vendas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {pipelineStages.map(stage => {
          const leadsInStage = getLeadsByStage(stage.id);
          return (
            <Card key={stage.id} className="bg-white shadow-sm border-l-4" style={{ borderLeftColor: stage.color }}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold" style={{ color: stage.color }}>
                  {leadsInStage.length}
                </div>
                <div className="text-sm text-slate-600 mt-1">{stage.name}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pipeline Kanban */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {pipelineStages.map(stage => {
          const leadsInStage = getLeadsByStage(stage.id);
          
          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80 bg-slate-50 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {leadsInStage.length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {leadsInStage.map(lead => (
                  <Card
                    key={lead.id}
                    className="cursor-move hover:shadow-md transition-shadow bg-white"
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-900">
                        {lead.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex items-center text-xs text-slate-600">
                        <Building className="w-3 h-3 mr-1" />
                        {lead.company}
                      </div>
                      <div className="flex items-center text-xs text-slate-600">
                        <Phone className="w-3 h-3 mr-1" />
                        {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="flex items-center text-xs text-slate-600">
                          <Mail className="w-3 h-3 mr-1" />
                          {lead.email}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline" className="text-xs">
                          {lead.niche}
                        </Badge>
                        <div className="flex items-center text-xs text-slate-500">
                          <User className="w-3 h-3 mr-1" />
                          {lead.responsible.split('@')[0]}
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                          <Archive className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {leadsInStage.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhum lead neste estágio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Scheduling Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Compromisso</DialogTitle>
            <DialogDescription>
              Agende um compromisso para este lead antes de movê-lo para o estágio Reunião
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-type">Tipo de Evento</Label>
              <Select value={eventData.type} onValueChange={(value: any) => setEventData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="event-date">Data</Label>
              <Input
                id="event-date"
                type="date"
                value={eventData.date}
                onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="event-time">Horário</Label>
              <Input
                id="event-time"
                type="time"
                value={eventData.time}
                onChange={(e) => setEventData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="event-responsible">Responsável</Label>
              <Input
                id="event-responsible"
                value={eventData.responsible}
                onChange={(e) => setEventData(prev => ({ ...prev, responsible: e.target.value }))}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEventDialog(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleScheduleEvent} className="flex-1">
                <Calendar className="w-4 h-4 mr-2" />
                Agendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
