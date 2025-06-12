
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  company?: string;
  lead_name?: string;
  responsible_id: string;
}

interface MobileWeeklyCalendarProps {
  events: Event[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export default function MobileWeeklyCalendar({ 
  events, 
  selectedDate, 
  onDateSelect, 
  onEventClick 
}: MobileWeeklyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const previousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const nextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const getEventsForDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateString);
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
      'ligacao': 'Tel',
      'email': 'Email',
      'visita': 'Visita',
      'followup': 'Follow'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex flex-col space-y-3">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(weekEnd, 'dd/MM/yyyy', { locale: ptBR })}
          </h3>
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={previousWeek}
            className="flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs">Anterior</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setCurrentWeek(new Date());
              onDateSelect(new Date());
            }}
            className="text-xs"
          >
            Hoje
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={nextWeek}
            className="flex items-center space-x-1"
          >
            <span className="text-xs">Próxima</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Days Carousel */}
      <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card 
              key={day.toISOString()}
              className={`flex-shrink-0 w-32 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${isToday ? 'border-blue-300' : ''}`}
              onClick={() => onDateSelect(day)}
            >
              <CardHeader className="p-3 pb-2">
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isToday ? 'text-blue-600' : 'text-slate-900'
                  }`}>
                    {format(day, 'd')}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-3 pt-0">
                <div className="space-y-1">
                  {dayEvents.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-2">
                      Sem eventos
                    </div>
                  ) : (
                    dayEvents.slice(0, 3).map((event) => (
                      <div 
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className="p-1 bg-white rounded border cursor-pointer hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <Badge className={`${getEventTypeBadge(event.type)} text-xs px-1 py-0`}>
                            {getEventTypeLabel(event.type)}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {event.time}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 mt-1 truncate">
                          {event.title}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-slate-500 text-center py-1">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Selected Day Events Detail */}
      {getEventsForDay(selectedDate).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Eventos de {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {getEventsForDay(selectedDate).map((event) => (
              <div 
                key={event.id}
                onClick={() => onEventClick(event)}
                className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge className={`${getEventTypeBadge(event.type)} text-xs`}>
                    {getEventTypeLabel(event.type)}
                  </Badge>
                  <span className="text-sm text-slate-600">{event.time}</span>
                </div>
                <div className="font-medium text-slate-900">{event.title}</div>
                {event.lead_name && event.company && (
                  <div className="text-sm text-slate-600">
                    {event.lead_name} - {event.company}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
