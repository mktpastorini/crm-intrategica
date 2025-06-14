import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, Calendar, User, Building, Archive } from 'lucide-react';
import PipelineColumn from '@/components/pipeline/PipelineColumn';
import UnknownStageColumn from '@/components/pipeline/UnknownStageColumn';
import type { Lead, PipelineStage } from '@/components/pipeline/types';

export default function Pipeline() {
  // Inicializar o rastreador de atividades
  
  // Fix: Explicitly cast leads and pipelineStages with the canonical types
  const context = useCrm();
  const leads = context.leads as Lead[];
  const pipelineStages = context.pipelineStages as PipelineStage[];
  const moveLead = context.moveLead;
  const addEvent = context.addEvent;
  const users = context.users;

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [eventData, setEventData] = useState({
    type: 'reunion' as 'reunion' | 'call' | 'whatsapp' | 'email',
    date: '',
    time: '',
    responsible_id: user?.id || ''
  });

  // Adicionando logs para depuração dos leads recebidos
  useEffect(() => {
    // Log dos estágios cadastrados para debug
    console.log('[DEPURAÇÃO PIPELINE] pipelineStages:', pipelineStages);
    // Log todos os leads recebidos e estágio atual:
    leads.forEach((lead) => {
      console.log(`[DEPURAÇÃO PIPELINE] Lead ${lead.name} (${lead.id}) - estágio: ${lead.pipeline_stage}`);
    });
  }, [leads, pipelineStages]);

  // -- IDs fixos para estágios principais
  // O primeiro estágio precisa sempre ser o "Aguardando Início" ('aguardando_contato')
  // O estágio de reunião precisa sempre ser "Reunião" ('reuniao')
  // Caso não exista no pipelineStages, exibir aviso (ou criar fallback)

  // Encontrar ids dos estágios:
  const pipelineStageIds = pipelineStages.map(s => s.id);

  const primeiroStageId = pipelineStages.find(s => s.id === "aguardando_contato")?.id || pipelineStages[0]?.id;
  const reuniaoStageId = pipelineStages.find(s => s.id === "reuniao")?.id || null;

  const leadsComStageDesconhecido = leads.filter(lead => !pipelineStageIds.includes(lead.pipeline_stage));

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
    
    if (!lead) return;

    // Para estágio de reunião, abrir modal
    if (reuniaoStageId && newStage === reuniaoStageId) {
      setSelectedLead(leadId);
      setShowEventDialog(true);
      return;
    }

    if (lead.pipeline_stage !== newStage) {
      console.log(`Movendo lead ${lead.name} de ${lead.pipeline_stage} para ${newStage}`);
      
      moveLead(leadId, newStage);
      toast({
        title: "Lead movido",
        description: `${lead.name} foi movido para ${pipelineStages.find(s => s.id === newStage)?.name}`,
      });
    }
  };

  const handleScheduleEvent = () => {
    if (!selectedLead || !eventData.date || !eventData.time || !eventData.responsible_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para agendar o evento",
        variant: "destructive",
      });
      return;
    }

    const lead = leads.find(l => l.id === selectedLead);
    if (!lead) return;

    // Agendar evento para o lead
    const startTime = `${eventData.date}T${eventData.time}`;
    addEvent({
      title: `${eventData.type === 'reunion' ? 'Reunião' : 
        eventData.type === 'call' ? 'Telefonema' :
        eventData.type === 'whatsapp' ? 'WhatsApp' : 'E-mail'} - ${lead.name}`,
      description: lead.name,
      start_time: startTime,
      end_time: startTime,
      location: lead.company || '',
      lead_id: selectedLead,
      user_id: eventData.responsible_id,
      type: eventData.type,
      date: eventData.date,
      time: eventData.time,
      company: lead.company,
      lead_name: lead.name,
      responsible_id: eventData.responsible_id
    });

    // Após agendar, move para reunião
    if (reuniaoStageId) {
      moveLead(selectedLead, reuniaoStageId);
    }

    setEventData({
      type: 'reunion',
      date: '',
      time: '',
      responsible_id: user?.id || ''
    });
    setSelectedLead(null);
    setShowEventDialog(false);

    toast({
      title: "Evento agendado",
      description: "O evento foi criado e o lead foi movido para o estágio Reunião",
    });
  };

  // Retorna leads para um determinado stageId
  // Importante: usa exatamente o id do estágio em pipelineStages para o filtro!
  const getLeadsByStage = (stageId: string) => {
    const leadsEmStage = leads
      .filter(lead => lead.pipeline_stage === stageId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    console.log(`[DEPURAÇÃO PIPELINE] Leads no estágio '${stageId}':`, leadsEmStage.map(l => l.name));
    return leadsEmStage;
  };

  const eventTypes = [
    { value: 'reunion', label: 'Reunião' },
    { value: 'call', label: 'Telefonema' },
    { value: 'whatsapp', label: 'Conversa no WhatsApp' },
    { value: 'email', label: 'E-mail' }
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header fixo - não move com scroll */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 z-10">
        <div className="px-6 py-4">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900">Pipeline de Atendimento</h2>
            <p className="text-slate-600">Gerencie o fluxo de leads através do processo de vendas</p>
          </div>

          {/* Stats - também fixas */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {pipelineStages.map(stage => {
              const leadsInStage = getLeadsByStage(stage.id);
              return (
                <Card key={stage.id} className="bg-white shadow-sm border-l-4" style={{ borderLeftColor: stage.color }}>
                  <CardContent className="p-3">
                    <div className="text-xl font-bold" style={{ color: stage.color }}>
                      {leadsInStage.length}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{stage.name}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="flex-1 overflow-hidden bg-slate-50">
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full" style={{ minWidth: `${(pipelineStages.length + (leadsComStageDesconhecido.length > 0 ? 1 : 0)) * 320}px` }}>
            {pipelineStages.map(stage => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                leads={getLeadsByStage(stage.id)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
              />
            ))}
            <UnknownStageColumn leads={leadsComStageDesconhecido} />
          </div>
        </div>
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
              <Select value={eventData.responsible_id} onValueChange={(value) => {
                setEventData(prev => ({ 
                  ...prev, 
                  responsible_id: value
                }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
