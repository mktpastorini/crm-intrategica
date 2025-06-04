import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  Trash2
} from 'lucide-react';

const eventTypeColors = {
  reunion: 'bg-blue-100 text-blue-800',
  call: 'bg-green-100 text-green-800',
  whatsapp: 'bg-emerald-100 text-emerald-800',
  email: 'bg-purple-100 text-purple-800'
};

const eventTypeIcons = {
  reunion: Video,
  call: Phone,
  whatsapp: MessageSquare,
  email: Mail
};

export default function Calendar() {
  const { leads, events, addEvent, updateEvent, deleteEvent } = useCrm();
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
    leadId: ''
  });

  // Corrigir o problema de timezone - usar data local sem conversão
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filtrar eventos do mês atual
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthEvents = events.filter(event => {
    const eventDate = parseLocalDate(event.date);
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
  });

  // Gerar dias do calendário
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = formatDateForInput(date);
      const dayEvents = events.filter(event => event.date === dateString);
      
      days.push({
        date,
        dateString,
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: formatDateForInput(new Date()) === dateString,
        events: dayEvents
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      leadName: event.leadName || '',
      company: event.company || '',
      date: event.date,
      time: event.time,
      type: event.type,
      leadId: event.leadId || ''
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

    const selectedLead = leads.find(lead => lead.id === newEvent.leadId);

    updateEvent(editingEvent.id, {
      title: newEvent.title,
      leadName: selectedLead?.name || newEvent.leadName,
      company: selectedLead?.company || newEvent.company,
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type,
      leadId: newEvent.leadId || undefined
    });

    setEditingEvent(null);
    setNewEvent({
      title: '',
      leadName: '',
      company: '',
      date: '',
      time: '',
      type: 'reunion',
      leadId: ''
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

    const selectedLead = leads.find(lead => lead.id === newEvent.leadId);
    
    addEvent({
      title: newEvent.title,
      leadName: selectedLead?.name || newEvent.leadName,
      company: selectedLead?.company || newEvent.company,
      date: newEvent.date,
      time: newEvent.time,
      responsible: user?.email || 'admin@crm.com',
      type: newEvent.type,
      leadId: newEvent.leadId || undefined
    });

    setNewEvent({
      title: '',
      leadName: '',
      company: '',
      date: '',
      time: '',
      type: 'reunion',
      leadId: ''
    });
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda</h2>
          <p className="text-slate-600">Gerencie eventos e compromissos</p>
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
              leadId: ''
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
                <Label htmlFor="lead-select">Lead (Opcional)</Label>
                <Select value={newEvent.leadId} onValueChange={(value) => {
                  const selectedLead = leads.find(lead => lead.id === value);
                  setNewEvent(prev => ({ 
                    ...prev, 
                    leadId: value,
                    leadName: selectedLead?.name || '',
                    company: selectedLead?.company || ''
                  }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum lead</SelectItem>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!newEvent.leadId && (
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
                      leadId: ''
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

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
        >
          Anterior
        </Button>
        <h3 className="text-xl font-semibold">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <Button 
          variant="outline" 
          onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
        >
          Próximo
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Calendário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  min-h-[80px] p-1 border border-slate-200 rounded
                  ${day.isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                  ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                <div className={`text-sm ${day.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'} ${day.isToday ? 'font-bold' : ''}`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-1 mt-1">
                  {day.events.slice(0, 2).map(event => {
                    const IconComponent = eventTypeIcons[event.type];
                    return (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded text-center cursor-pointer ${eventTypeColors[event.type]}`}
                        title={`${event.title} - ${event.time}`}
                      >
                        <div className="flex items-center gap-1 justify-center">
                          <IconComponent className="w-3 h-3" />
                          <span className="truncate">{event.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  {day.events.length > 2 && (
                    <div className="text-xs text-slate-600 text-center">
                      +{day.events.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events
              .filter(event => new Date(event.date + 'T' + event.time) >= new Date())
              .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
              .slice(0, 5)
              .map(event => {
                const IconComponent = eventTypeIcons[event.type];
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${eventTypeColors[event.type]}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{event.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {new Date(event.date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {event.time}
                          </span>
                          {event.leadName && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {event.leadName}
                            </span>
                          )}
                          {event.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {event.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            {events.length === 0 && (
              <p className="text-center text-slate-500 py-8">Nenhum evento agendado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
