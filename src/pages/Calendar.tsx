
import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar as CalendarIcon, Clock, User, Edit, Trash2, Upload, X } from 'lucide-react';

export default function Calendar() {
  const { events, leads, addEvent, updateEvent, deleteEvent } = useCrm();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [newEvent, setNewEvent] = useState({
    title: '',
    leadName: '',
    company: '',
    date: '',
    time: '',
    responsible: user?.email || '',
    type: 'reunion' as 'reunion' | 'call' | 'whatsapp' | 'email',
    leadId: ''
  });

  const eventTypes = [
    { value: 'reunion', label: 'Reunião' },
    { value: 'call', label: 'Telefonema' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'E-mail' }
  ];

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  const selectedDateEvents = selectedDate ? events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.toDateString() === selectedDate.toDateString();
  }) : [];

  // Get this week's events
  const getWeekEvents = () => {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    }).sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());
  };

  const weekEvents = getWeekEvents();

  // Check if date has events for calendar highlighting
  const hasEvents = (date: Date) => {
    return events.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Título, Data e Hora são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Corrigir o problema de data: usar a data exata sem conversão de timezone
    const eventDate = new Date(newEvent.date + 'T00:00:00');
    const formattedDate = eventDate.toISOString().split('T')[0];

    addEvent({
      ...newEvent,
      date: formattedDate
    });
    
    setNewEvent({
      title: '',
      leadName: '',
      company: '',
      date: '',
      time: '',
      responsible: user?.email || '',
      type: 'reunion',
      leadId: ''
    });
    setImageFile(null);
    setShowAddDialog(false);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent({ ...event });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;

    // Corrigir o problema de data na edição também
    const eventDate = new Date(editingEvent.date + 'T00:00:00');
    const formattedDate = eventDate.toISOString().split('T')[0];

    updateEvent(editingEvent.id, {
      ...editingEvent,
      date: formattedDate
    });
    setShowEditDialog(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
  };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setNewEvent(prev => ({
        ...prev,
        leadId,
        leadName: lead.name,
        company: lead.company
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      toast({
        title: "Imagem selecionada",
        description: `Arquivo ${file.name} foi selecionado`,
      });
    }
  };

  const removeImageFile = () => {
    setImageFile(null);
    toast({
      title: "Imagem removida",
      description: "Arquivo de imagem foi removido",
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      'reunion': 'bg-blue-100 text-blue-800',
      'call': 'bg-green-100 text-green-800',
      'whatsapp': 'bg-emerald-100 text-emerald-800',
      'email': 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'reunion': 'Reunião',
      'call': 'Telefonema',
      'whatsapp': 'WhatsApp',
      'email': 'E-mail'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Format calendar to show events in each day
  const getDayContent = (date: Date) => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });

    return dayEvents.slice(0, 2); // Show only first 2 events per day
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda</h2>
          <p className="text-slate-600">Organize todos os seus compromissos comerciais</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Evento</DialogTitle>
              <DialogDescription>
                Agende um novo compromisso
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do evento"
                />
              </div>
              <div>
                <Label htmlFor="lead-select">Lead (opcional)</Label>
                <Select value={newEvent.leadId} onValueChange={handleLeadSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(lead => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lead-name">Nome do Lead</Label>
                <Input
                  id="lead-name"
                  value={newEvent.leadName}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, leadName: e.target.value }))}
                  placeholder="Nome do contato"
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
              <div>
                <Label htmlFor="type">Tipo de Evento</Label>
                <Select value={newEvent.type} onValueChange={(value: any) => setNewEvent(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Adicionar Imagem (opcional)</Label>
                <div className="mt-2">
                  {imageFile ? (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                      <span className="text-sm text-slate-700 flex-1">{imageFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={removeImageFile}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar Imagem
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleAddEvent} className="flex-1">
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias
            </DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-lead-name">Nome do Lead</Label>
                <Input
                  id="edit-lead-name"
                  value={editingEvent.leadName || ''}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, leadName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-company">Empresa</Label>
                <Input
                  id="edit-company"
                  value={editingEvent.company || ''}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-date">Data *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingEvent.date}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-time">Hora *</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editingEvent.time}
                  onChange={(e) => setEditingEvent(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Tipo de Evento</Label>
                <Select value={editingEvent.type} onValueChange={(value: any) => setEditingEvent(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1">
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{todayEvents.length}</div>
            <p className="text-sm text-blue-600">eventos agendados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Esta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{weekEvents.length}</div>
            <p className="text-sm text-green-600">eventos esta semana</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{events.length}</div>
            <p className="text-sm text-purple-600">eventos no total</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Large Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {/* Get current month calendar days */}
              {(() => {
                const now = selectedDate || new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDate = new Date(firstDay);
                startDate.setDate(startDate.getDate() - firstDay.getDay());
                
                const days = [];
                for (let i = 0; i < 42; i++) {
                  const currentDate = new Date(startDate);
                  currentDate.setDate(startDate.getDate() + i);
                  days.push(currentDate);
                }
                
                return days.map((date, index) => {
                  const dayEvents = getDayContent(date);
                  const isCurrentMonth = date.getMonth() === month;
                  const isTodayDate = isToday(date);
                  const hasEventsToday = hasEvents(date);
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-28 p-2 border border-slate-200 cursor-pointer
                        ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                        ${isTodayDate ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : ''}
                        ${hasEventsToday ? 'border-blue-300' : ''}
                        hover:bg-slate-50 transition-colors
                      `}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className={`
                        text-sm font-medium mb-2
                        ${isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}
                        ${isTodayDate ? 'text-blue-600 font-bold' : ''}
                      `}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event, eventIndex) => (
                          <div
                            key={eventIndex}
                            className="text-xs p-1 bg-blue-100 text-blue-700 rounded truncate"
                            title={`${event.time} - ${event.title}`}
                          >
                            <div className="font-medium">{event.time}</div>
                            <div className="truncate">{event.title}</div>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-slate-500 text-center">
                            +{dayEvents.length - 2} mais
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Week Events Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            {weekEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600">Nenhum evento esta semana</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weekEvents.map((event) => (
                  <div key={event.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-sm font-medium text-slate-900">
                        {new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="text-sm text-slate-600">{event.time}</div>
                    </div>
                    <h4 className="font-medium text-slate-900 mb-1">{event.title}</h4>
                    {event.leadName && (
                      <p className="text-sm text-slate-600">{event.leadName}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <Badge className={`${getEventTypeColor(event.type)} text-xs`}>
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
