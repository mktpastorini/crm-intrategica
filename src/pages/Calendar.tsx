
import { useState, useEffect } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Calendar() {
  const { user } = useAuth();
  const { 
    events, 
    leads,
    loading, 
    actionLoading,
    loadEvents,
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
        responsible_id: user?.id || ''
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
    console.log('Editando evento:', event);
    setEditingEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time,
      company: event.company || '',
      lead_id: event.lead_id || '',
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
      lead_id: '',
      lead_name: '',
      responsible_id: user?.id || ''
    });
  };

  const getEventTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'reuniao': return 'bg-blue-100 text-blue-800';
      case 'ligacao': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      case 'visita': return 'bg-orange-100 text-orange-800';
      case 'followup': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEventDate = (date: string) => {
    try {
      return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
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
          <h2 className="text-2xl font-bold text-slate-900">Calendário</h2>
          <p className="text-slate-600">Gerencie seus eventos e compromissos</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
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
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="ligacao">Ligação</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
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
                    <SelectItem value="">Nenhum lead</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} - {lead.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!formData.lead_id && (
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
                <Button type="submit" className="flex-1" disabled={actionLoading === 'create-event' || actionLoading === editingEvent?.id}>
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

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{event.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatEventDate(event.date)} às {event.time}
                      </div>
                      {event.company && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {event.lead_name} - {event.company}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <Badge className={getEventTypeBadgeColor(event.type)}>
                        {event.type === 'reuniao' ? 'Reunião' :
                         event.type === 'ligacao' ? 'Ligação' :
                         event.type === 'email' ? 'E-mail' :
                         event.type === 'visita' ? 'Visita' :
                         event.type === 'followup' ? 'Follow-up' : event.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(event.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={actionLoading === event.id}
                  >
                    {actionLoading === event.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-slate-600">Comece adicionando um novo evento ao calendário.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
