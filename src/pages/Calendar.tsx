
import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  User, 
  Building2,
  Phone,
  Mail,
  Video,
  MessageSquare,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const eventTypeColors = {
  reunion: 'bg-blue-100 text-blue-800 border-blue-200',
  call: 'bg-green-100 text-green-800 border-green-200',
  whatsapp: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  email: 'bg-purple-100 text-purple-800 border-purple-200'
};

const eventTypeIcons = {
  reunion: Video,
  call: Phone,
  whatsapp: MessageSquare,
  email: Mail
};

export default function Calendar() {
  const { leads, events, addEvent, updateEvent, deleteEvent, users } = useCrm();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    leadName: '',
    company: '',
    date: '',
    time: '',
    type: 'reunion' as 'reunion' | 'call' | 'whatsapp' | 'email',
    leadId: '',
    responsible_id: user?.id || ''
  });

  useEffect(() => {
    if (user?.id && !newEvent.responsible_id) {
      setNewEvent(prev => ({ ...prev, responsible_id: user.id }));
    }
  }, [user]);

  // Função para obter a semana atual
  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Domingo = 0
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  // Formatar data para comparação
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (date: Date) => {
    return formatDateForInput(date) === formatDateForInput(today);
  };

  // Navegação da semana
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obter eventos de um dia específico
  const getEventsForDay = (date: Date) => {
    const dateString = formatDateForInput(date);
    return events.filter(event => event.date === dateString);
  };

  // Obter próximos eventos (próximos 5 dias)
  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => {
        const eventDateTime = new Date(event.date + 'T' + event.time);
        return eventDateTime >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 8);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      leadName: event.leadName || '',
      company: event.company || '',
      date: event.date,
      time: event.time,
      type: event.type,
      leadId: event.leadId || '',
      responsible_id: event.responsible_id || user?.id || ''
    });
  };

  const handleUpdateEvent = () => {
    if (!editingEvent || !newEvent.title || !newEvent.date || !newEvent.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, data e hora",
        variant: "destructive",
      });
      return;
    }

    const selectedLead = newEvent.leadId && newEvent.leadId !== 'none' ? leads.find(lead => lead.id === newEvent.leadId) : null;

    updateEvent(editingEvent.id, {
      title: newEvent.title,
      leadName: selectedLead?.name || newEvent.leadName,
      company: selectedLead?.company || newEvent.company,
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type,
      leadId: selectedLead ? newEvent.leadId : undefined,
      responsible_id: newEvent.responsible_id
    });

    setEditingEvent(null);
    setNewEvent({
      title: '',
      leadName: '',
      company: '',
      date: '',
      time: '',
      type: 'reunion',
      leadId: '',
      responsible_id: user?.id || ''
    });
    setShowAddDialog(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, data e hora",
        variant: "destructive",
      });
      return;
    }

    const selectedLead = newEvent.leadId && newEvent.leadId !== 'none' ? leads.find(lead => lead.id === newEvent.leadId) : null;
    
    addEvent({
      title: newEvent.title,
      leadName: selectedLead?.name || newEvent.leadName,
      company: selectedLead?.company || newEvent.company,
      date: newEvent.date,
      time: newEvent.time,
      responsible: user?.name || 'Sistema',
      type: newEvent.type,
      leadId: selectedLead ? newEvent.leadId : undefined,
      responsible_id: newEvent.responsible_id
    });

    setNewEvent({
      title: '',
      leadName: '',
      company: '',
      date: '',
      time: '',
      type: 'reunion',
      leadId: '',
      responsible_id: user?.id || ''
    });
    setShowAddDialog(false);
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Calendário Principal */}
      <div className="lg:col-span-3 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Agenda</h2>
            <p className="text-slate-600">Visualização semanal dos eventos</p>
          </div>
          <Dialog open={showAddDialog || !!editingEvent} onOpenChange={(open) => {
            if (!open) {
              setShowAddDialog(false);
              setEditingEvent(null);
              setNewEvent({
                title: '',
                leadName: '',
                company: '',
                date: '',
                time: '',
                type: 'reunion',
                leadId: '',
                responsible_id: user?.id || ''
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent ? 'Atualize as informações do evento' : 'Adicione um novo evento à agenda'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Reunião de negócios"
                  />
                </div>

                <div>
                  <Label htmlFor="responsible">Responsável *</Label>
                  <Select 
                    value={newEvent.responsible_id} 
                    onValueChange={(value) => setNewEvent(prev => ({ ...prev, responsible_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(userItem => (
                        <SelectItem key={userItem.id} value={userItem.id}>
                          {userItem.name} - {userItem.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lead-select">Lead (Opcional)</Label>
                  <Select value={newEvent.leadId} onValueChange={(value) => {
                    const selectedLead = value !== 'none' ? leads.find(lead => lead.id === value) : null;
                    setNewEvent(prev => ({ 
                      ...prev, 
                      leadId: value === 'none' ? '' : value,
                      leadName: selectedLead?.name || '',
                      company: selectedLead?.company || ''
                    }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum lead</SelectItem>
                      {leads.map(lead => (
                        <SelectItem key={lead.id} value={lead.id}>
                          {lead.name} - {lead.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(!newEvent.leadId || newEvent.leadId === 'none') && (
                  <>
                    <div>
                      <Label htmlFor="lead-name">Nome do Contato</Label>
                      <Input
                        id="lead-name"
                        value={newEvent.leadName}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, leadName: e.target.value }))}
                        placeholder="Nome da pessoa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={newEvent.company}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Hora *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Evento</Label>
                  <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reunion">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Reunião
                        </div>
                      </SelectItem>
                      <SelectItem value="call">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Ligação
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          E-mail
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddDialog(false);
                      setEditingEvent(null);
                      setNewEvent({
                        title: '',
                        leadName: '',
                        company: '',
                        date: '',
                        time: '',
                        type: 'reunion',
                        leadId: '',
                        responsible_id: user?.id || ''
                      });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={editingEvent ? handleUpdateEvent : handleAddEvent} 
                    className="flex-1"
                  >
                    {editingEvent ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Navegação da Semana */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={goToPreviousWeek}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Semana Anterior
          </Button>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={goToToday}>
              Hoje
            </Button>
            <h3 className="text-lg font-semibold">
              {weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </h3>
          </div>
          <Button variant="outline" onClick={goToNextWeek}>
            Próxima Semana
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Visualização Semanal */}
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayName, index) => (
                <div key={dayName} className="p-4 text-center border-r last:border-r-0">
                  <div className="text-sm font-medium text-slate-600">{dayName}</div>
                  <div className={`text-lg font-semibold mt-1 ${isToday(weekDays[index]) ? 'text-blue-600 bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : 'text-slate-900'}`}>
                    {weekDays[index].getDate()}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 min-h-[400px]">
              {weekDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                return (
                  <div key={index} className={`p-2 border-r last:border-r-0 ${isToday(day) ? 'bg-blue-50' : ''}`}>
                    <div className="space-y-1">
                      {dayEvents.map(event => {
                        const IconComponent = eventTypeIcons[event.type];
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-2 rounded border cursor-pointer hover:shadow-sm ${eventTypeColors[event.type]}`}
                            title={`${event.title} - ${event.time}`}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <IconComponent className="w-3 h-3" />
                              <span className="font-medium truncate">{event.title}</span>
                            </div>
                            <div className="text-xs opacity-75">{event.time}</div>
                            {event.leadName && (
                              <div className="text-xs opacity-75 truncate">{event.leadName}</div>
                            )}
                            <div className="flex gap-1 mt-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-white/50"
                                onClick={() => handleEditEvent(event)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-white/50 text-red-600"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Próximos Eventos */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => {
                  const IconComponent = eventTypeIcons[event.type];
                  const responsibleUser = users.find(u => u.id === event.responsible_id);
                  const eventDate = new Date(event.date + 'T' + event.time);
                  const isEventToday = isToday(new Date(event.date));
                  
                  return (
                    <div key={event.id} className={`p-3 border rounded-lg ${isEventToday ? 'border-blue-200 bg-blue-50' : 'border-slate-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className={`p-1 rounded-full ${eventTypeColors[event.type]}`}>
                            <IconComponent className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-slate-900 truncate">{event.title}</h4>
                            <div className="text-xs text-slate-600 space-y-1">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                <span>{new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                <Clock className="w-3 h-3 ml-1" />
                                <span>{event.time}</span>
                              </div>
                              {responsibleUser && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span className="truncate">{responsibleUser.name}</span>
                                </div>
                              )}
                              {event.leadName && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span className="truncate">{event.leadName}</span>
                                </div>
                              )}
                              {event.company && (
                                <div className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate">{event.company}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditEvent(event)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-slate-500 py-8 text-sm">Nenhum evento próximo</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
