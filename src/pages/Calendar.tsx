
import { useState } from 'react';
import { useCrm } from '@/contexts/CrmContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Plus, User, Building } from 'lucide-react';

export default function Calendar() {
  const { events } = useCrm();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current week
  const getWeekDays = (date: Date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    startDate.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);
      week.push(currentDay);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);
  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const getAllEventsThisWeek = () => {
    return weekDays.flatMap(day => getEventsForDate(day));
  };

  const getAllEventsThisMonth = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
  };

  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date === today);
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      'reunion': 'bg-blue-100 text-blue-800 border-blue-200',
      'call': 'bg-green-100 text-green-800 border-green-200',
      'whatsapp': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'email': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'reunion': return '🤝';
      case 'call': return '📞';
      case 'whatsapp': return '💬';
      case 'email': return '📧';
      default: return '📅';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda</h2>
          <p className="text-slate-600">Organize todos os seus compromissos comerciais</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Evento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{getTodayEvents().length}</div>
            <p className="text-sm text-blue-600">eventos programados</p>
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
            <div className="text-3xl font-bold text-green-700">{getAllEventsThisWeek().length}</div>
            <p className="text-sm text-green-600">compromissos agendados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{getAllEventsThisMonth().length}</div>
            <p className="text-sm text-purple-600">eventos no total</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Semana de {weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigateWeek('prev')}>
                ← Anterior
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Hoje
              </Button>
              <Button variant="outline" onClick={() => navigateWeek('next')}>
                Próxima →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-48 p-3 border-2 rounded-lg ${
                    isToday ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="text-sm font-medium text-slate-600">{dayNames[index]}</div>
                    <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-slate-900'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`p-2 rounded border text-xs ${getEventTypeColor(event.type)}`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span>{getEventTypeIcon(event.type)}</span>
                          <span className="font-medium">{event.time}</span>
                        </div>
                        <div className="font-medium truncate">{event.title}</div>
                        {event.leadName && (
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                            <User className="w-3 h-3" />
                            <span className="truncate">{event.leadName}</span>
                          </div>
                        )}
                        {event.company && (
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                            <Building className="w-3 h-3" />
                            <span className="truncate">{event.company}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Events Detail */}
      {getTodayEvents().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Hoje</CardTitle>
            <CardDescription>Seus compromissos programados para hoje</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getTodayEvents()
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(event => (
                <div key={event.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{getEventTypeIcon(event.type)}</div>
                    <div>
                      <div className="font-medium text-slate-900">{event.title}</div>
                      <div className="text-sm text-slate-600 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </span>
                        {event.company && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {event.company}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {event.responsible}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getEventTypeColor(event.type)}>
                    {event.type === 'reunion' ? 'Reunião' :
                     event.type === 'call' ? 'Telefonema' :
                     event.type === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
