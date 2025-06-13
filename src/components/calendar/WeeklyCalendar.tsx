
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Edit, Trash2, Plus, Check } from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  company?: string;
  lead_name?: string;
  completed?: boolean;
}

interface WeeklyCalendarProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddEvent: () => void;
  onCompleteEvent?: (eventId: string) => void;
}

export default function WeeklyCalendar({ events, onEditEvent, onDeleteEvent, onAddEvent, onCompleteEvent }: WeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const isMobile = useIsMobile();

  const startDate = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      try {
        return isSameDay(parseISO(event.date), date);
      } catch {
        return false;
      }
    });
  };

  const getEventTypeBadge = (type: string) => {
    const colors = {
      'reuniao': 'bg-blue-100 text-blue-800',
      'ligacao': 'bg-green-100 text-green-800',
      'email': 'bg-purple-100 text-purple-800',
      'visita': 'bg-orange-100 text-orange-800',
      'followup': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getEventTypeLabel = (type: string) => {
    const labels = {
      'reuniao': 'Reunião',
      'ligacao': 'Ligação',
      'email': 'E-mail',
      'visita': 'Visita',
      'followup': 'Follow-up'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isEventToday = (event: Event) => isSameDay(parseISO(event.date), new Date());

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayNamesFull = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const EventCard = ({ event }: { event: Event }) => (
    <div className={`p-3 rounded border ${event.completed ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <Badge className={`${getEventTypeBadge(event.type)} text-xs px-2 py-1`}>
          {getEventTypeLabel(event.type)}
        </Badge>
        <div className="flex space-x-1">
          {isEventToday(event) && !event.completed && onCompleteEvent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCompleteEvent(event.id)}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
              title="Marcar como realizado"
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditEvent(event)}
            className="h-6 w-6 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteEvent(event.id)}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-1">
        <h4 className={`text-sm font-semibold leading-tight ${event.completed ? 'text-green-900 line-through' : 'text-slate-900'}`}>
          {event.title}
        </h4>
        <p className="text-xs text-slate-600 font-medium">
          {event.time}
        </p>
        {event.lead_name && (
          <p className="text-xs text-slate-700 leading-tight">
            <span className="font-medium">Contato:</span> {event.lead_name}
          </p>
        )}
        {event.company && (
          <p className="text-xs text-slate-600 leading-tight">
            <span className="font-medium">Empresa:</span> {event.company}
          </p>
        )}
        {event.completed && (
          <p className="text-xs text-green-600 font-medium">
            ✓ Realizado
          </p>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Header com título da semana */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-3">
            {format(startDate, 'dd', { locale: ptBR })} de {format(startDate, 'MMM', { locale: ptBR })}. - {format(addDays(startDate, 6), 'dd', { locale: ptBR })} de {format(addDays(startDate, 6), 'MMM', { locale: ptBR })} de {format(startDate, 'yyyy', { locale: ptBR })}
          </h3>
        </div>

        {/* Botões de navegação */}
        <div className="flex items-center justify-between gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentWeek(new Date())}
            className="flex-1"
          >
            Hoje
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="flex-1"
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Carrossel de dias da semana */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDayIndex(index)}
              className={`flex-shrink-0 flex flex-col items-center p-3 rounded-lg border min-w-[80px] ${
                selectedDayIndex === index
                  ? 'bg-blue-500 text-white border-blue-500'
                  : isToday(day)
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              <span className="text-xs font-medium">{dayNames[index]}</span>
              <span className="text-lg font-bold">{format(day, 'd')}</span>
              <div className="flex gap-1 mt-1">
                {getEventsForDay(day).slice(0, 3).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-current rounded-full opacity-60" />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Detalhes do dia selecionado */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {dayNamesFull[selectedDayIndex]}, {format(weekDays[selectedDayIndex], 'd')} de {format(weekDays[selectedDayIndex], 'MMMM', { locale: ptBR })}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddEvent}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {getEventsForDay(weekDays[selectedDayIndex]).length > 0 ? (
              getEventsForDay(weekDays[selectedDayIndex]).map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">
                Nenhum evento neste dia
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com navegação semanal */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {format(startDate, 'dd', { locale: ptBR })} de {format(startDate, 'MMM', { locale: ptBR })}. - {format(addDays(startDate, 6), 'dd', { locale: ptBR })} de {format(addDays(startDate, 6), 'MMM', { locale: ptBR })} de {format(startDate, 'yyyy', { locale: ptBR })}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="w-4 h-4" />
            Semana Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            Próxima Semana
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid do calendário semanal */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          
          return (
            <Card key={index} className={`min-h-[250px] ${isToday(day) ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-600">{dayNamesFull[index]}</p>
                    <p className={`text-lg font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-900'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddEvent}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3 space-y-2">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
                {dayEvents.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Nenhum evento
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
