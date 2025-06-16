
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
import { createJourneySchedule } from "@/utils/journeyScheduleService";
import { DollarSign, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Pipeline() {
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
  const [showProposalSelection, setShowProposalSelection] = useState(false);
  const [proposals, setProposals] = useState([]);

  // Adicionando logs para depuração dos leads recebidos
  useEffect(() => {
    console.log('[DEPURAÇÃO PIPELINE] pipelineStages:', pipelineStages);
    leads.forEach((lead) => {
      console.log(`[DEPURAÇÃO PIPELINE] Lead ${lead.name} (${lead.id}) - estágio: ${lead.pipeline_stage}`);
    });
  }, [leads, pipelineStages]);

  const pipelineStageIds = pipelineStages.map(s => s.id);
  const primeiroStageId = pipelineStages.find(s => s.id === "aguardando_contato")?.id || pipelineStages[0]?.id;
  const reuniaoStageId = pipelineStages.find(s => s.id === "reuniao")?.id || null;

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Função auxiliar: carrega mensagens da jornada do localStorage
  const getJourneyMessages = () => {
    const saved = localStorage.getItem("journeyMessages");
    if (!saved) return [];
    try {
      return JSON.parse(saved) || [];
    } catch {
      return [];
    }
  };

  // Adiciona schedules para as mensagens da jornada ao mover o lead
  const scheduleJourneyMessages = async (lead, newStage) => {
    const journeyMessages = getJourneyMessages();
    const messagesForStage = journeyMessages.filter((m) => m.stage === newStage);

    console.log("[Jornada] Mensagens configuradas para o estágio:", newStage, messagesForStage);

    if (!messagesForStage.length) {
      toast({
        title: "Nenhuma mensagem de jornada encontrada",
        description: `Nenhuma mensagem automática configurada para o estágio ${newStage}`,
        variant: "default",
      });
      return;
    }

    const scheduled_for_base = new Date();
    let countSuccess = 0;
    let countError = 0;
    let countNoWebhook = 0;

    for (const msg of messagesForStage) {
      const delayMs =
        msg.delayUnit === "days"
          ? msg.delay * 24 * 60 * 60 * 1000
          : msg.delayUnit === "hours"
          ? msg.delay * 60 * 60 * 1000
          : msg.delay * 60 * 1000;

      const scheduled_for = new Date(scheduled_for_base.getTime() + delayMs).toISOString();

      const webhook_url = msg.webhookUrl || msg.webhook_url || null;

      if (!webhook_url) {
        countNoWebhook++;
        console.warn(
          `[Jornada] Nenhum webhook_url definido para mensagem "${msg.title}" (lead: ${lead.name}). Mensagem NÃO será disparada automaticamente!`
        );
      }

      try {
        await createJourneySchedule({
          lead_id: lead.id,
          lead_name: lead.name,
          lead_phone: lead.phone,
          lead_email: lead.email,
          stage: newStage,
          message_title: msg.title,
          message_content: msg.content,
          message_type: msg.type,
          media_url: msg.mediaUrl,
          scheduled_for,
          webhook_url,
        });
        countSuccess++;
        console.log(
          `[Jornada] Agendamento criado para "${lead.name}", estágio ${newStage}, mensagem "${msg.title}", webhook: ${webhook_url || "NULO"}`
        );
      } catch (err) {
        countError++;
        console.error("[Jornada] Erro ao agendar mensagem:", err, msg, lead);
      }
    }

    let extra = "";
    if (countNoWebhook)
      extra += ` (${countNoWebhook} mensagem(ns) sem webhook, não serão disparadas)`; 

    toast({
      title: "Agendamento da Jornada",
      description: `Foram agendadas ${countSuccess} mensagem(ns)${extra}${countError ? `. ${countError} falharam` : ""}`,
      variant: countError > 0 ? "destructive" : "default",
    });
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

    // Para estágio de "Proposta Enviada", SEMPRE verificar se tem proposta vinculada
    if (newStage === 'proposta_enviada') {
      // Verificar se o lead já tem uma proposta vinculada
      if (!lead.proposal_id) {
        // Mostrar modal para selecionar proposta - OBRIGATÓRIO
        setSelectedLead(leadId);
        setShowProposalSelection(true);
        return;
      }
    }

    // Só move o lead se não for para "proposta_enviada" ou se já tiver proposta vinculada
    if (lead.pipeline_stage !== newStage) {
      console.log(`Movendo lead ${lead.name} de ${lead.pipeline_stage} para ${newStage}`);

      moveLead(leadId, newStage);
      toast({
        title: "Lead movido",
        description: `${lead.name} foi movido para ${pipelineStages.find(s => s.id === newStage)?.name}`,
      });

      // Agendamento de mensagens da jornada
      scheduleJourneyMessages(lead, newStage);
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

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProposals(data);
    } catch (error) {
      console.error('Erro ao carregar propostas:', error);
    }
  };

  const linkProposalAndMove = async (proposalId: string) => {
    if (!selectedLead) return;

    try {
      // Vincular proposta ao lead
      const { error: updateLeadError } = await supabase
        .from('leads')
        .update({ proposal_id: proposalId })
        .eq('id', selectedLead);

      if (updateLeadError) throw updateLeadError;

      // Vincular lead à proposta
      const { error: updateProposalError } = await supabase
        .from('proposals')
        .update({ lead_id: selectedLead })
        .eq('id', proposalId);

      if (updateProposalError) throw updateProposalError;

      // Mover para o estágio de proposta enviada
      moveLead(selectedLead, 'proposta_enviada');

      setShowProposalSelection(false);
      setSelectedLead(null);

      toast({
        title: "Proposta vinculada e lead movido",
        description: "Lead foi movido para Proposta Enviada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao vincular proposta:', error);
      toast({
        title: "Erro",
        description: "Erro ao vincular proposta ao lead",
        variant: "destructive"
      });
    }
  };

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
          <div className="flex gap-4 p-6 h-full" style={{ minWidth: `${(pipelineStages.length) * 320}px` }}>
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

      {/* Proposal Selection Dialog */}
      <Dialog open={showProposalSelection} onOpenChange={setShowProposalSelection}>
        <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Proposta - OBRIGATÓRIO</DialogTitle>
            <DialogDescription>
              Para mover este lead para "Proposta Enviada", você DEVE vincular uma proposta. O lead não será movido sem vincular uma proposta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {proposals.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {proposals.map((proposal) => (
                  <Card 
                    key={proposal.id} 
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => linkProposalAndMove(proposal.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">
                        {proposal.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-semibold">
                          <DollarSign className="w-3 h-3 mr-1" />
                          R$ {proposal.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Nenhuma proposta criada ainda</p>
                <p className="text-sm">Crie uma proposta na seção Propostas primeiro</p>
              </div>
            )}
            <Button variant="outline" onClick={() => setShowProposalSelection(false)} className="w-full">
              Cancelar - Lead não será movido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
