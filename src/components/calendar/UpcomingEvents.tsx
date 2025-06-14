
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

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

interface UpcomingEventsProps {
  events: Event[];
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
}

export default function UpcomingEvents({ events, onEditEvent, onDeleteEvent }: UpcomingEventsProps) {
  const { profile } = useAuth();
  
  const upcomingEvents = events
    .filter(event => {
      try {
        const eventDate = parseISO(`${event.date}T${event.time}`);
        return isAfter(eventDate, new Date());
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const dateA = parseISO(`${a.date}T${a.time}`);
        const dateB = parseISO(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    })
    .slice(0, 5);

  const formatEventDate = (date: string) => {
    try {
      return format(parseISO(date), 'dd/MM', { locale: ptBR });
    } catch {
      return date;
    }
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
      'ligacao': 'Telefonema',
      'email': 'E-mail',
      'visita': 'Visita',
      'followup': 'Follow-up'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum evento próximo
          </p>
        ) : (
          upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getEventTypeBadge(event.type)} text-xs`}>
                    {getEventTypeLabel(event.type)}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {formatEventDate(event.date)} às {event.time}
                  </span>
                </div>
                <p className="font-medium text-sm text-slate-900">{event.title}</p>
                {event.lead_name && event.company && (
                  <p className="text-xs text-slate-600">
                    {event.lead_name} - {event.company}
                  </p>
                )}
              </div>
              <div className="flex space-x-1 hidden md:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditEvent(event)}
                  className="h-7 w-7 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteEvent(event.id)}
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
