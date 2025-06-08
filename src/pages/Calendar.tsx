
import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettingsDB } from '@/hooks/useSystemSettingsDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar as CalendarIcon, Users, Phone, Mail, MapPin, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import WeeklyCalendar from '@/components/calendar/WeeklyCalendar';
import UpcomingEvents from '@/components/calendar/UpcomingEvents';

const eventTypeOptions = [
  { value: 'reuniao', label: 'Reunião', icon: Users, color: '#1d0029' },
  { value: 'ligacao', label: 'Ligação', icon: Phone, color: '#e11d48' },
  { value: 'email', label: 'E-mail', icon: Mail, color: '#3b82f6' },
  { value: 'visita', label: 'Visita', icon: MapPin, color: '#10b981' },
  { value: 'followup', label: 'Follow-up', icon: Clock, color: '#f59e0b' },
];

export default function Calendar() {
  const { user } = useAuth();
  const { settings } = useSystemSettingsDB();
  const { 
    events, 
    leads,
    loading, 
    actionLoading,
    createEvent, 
    updateEvent, 
    deleteEvent 
  } = useCrm();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'reuniao',
    date: '',
    time: '',
    company: '',
    lead_id: '',
    lead_name: '',
    responsible_id: user?.id || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedLead = leads.find(lead => lead.id === formData.lead_id);
      const eventData = {
        ...formData,
        lead_name: selectedLead?.name || formData.lead_name,
        company: selectedLead?.company || formData.company,
        responsible_id: user?.id || '',
        lead_id: formData.lead_id === 'none' ? '' : formData.lead_id
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await createEvent(eventData);
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time,
      company: event.company || '',
      lead_id: event.lead_id || 'none',
      lead_name: event.lead_name || '',
      responsible_id: event.responsible_id
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    
    try {
      await deleteEvent(eventId);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
    }
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      type: 'reuniao',
      date: '',
      time: '',
      company: '',
      lead_id: 'none',
      lead_name: '',
      responsible_id: user?.id || ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Carregando eventos..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda</h2>
          <p className="text-slate-600">Visualização semanal dos eventos</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: settings.primaryColor }}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Edite as informações do evento' : 'Adicione um novo evento ao calendário'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Evento</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: option.color }} />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="lead_id">Lead (opcional)</Label>
                <Select value={formData.lead_id} onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum lead</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.lead_id === 'none' && (
                <>
                  <div>
                    <Label htmlFor="lead_name">Nome do Contato</Label>
                    <Input
                      id="lead_name"
                      value={formData.lead_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, lead_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={actionLoading === 'create-event' || actionLoading === editingEvent?.id}
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {(actionLoading === 'create-event' || actionLoading === editingEvent?.id) ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    editingEvent ? 'Atualizar' : 'Criar Evento'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <WeeklyCalendar
            events={events}
            onEditEvent={handleEdit}
            onDeleteEvent={handleDelete}
            onAddEvent={() => setShowAddDialog(true)}
          />
        </div>
        <div className="xl:col-span-1">
          <UpcomingEvents
            events={events}
            onEditEvent={handleEdit}
            onDeleteEvent={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
