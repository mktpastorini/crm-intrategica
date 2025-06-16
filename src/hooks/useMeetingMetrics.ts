
import { useMemo } from 'react';
import { Event } from '@/types/event';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

interface MeetingMetrics {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export function useMeetingMetrics(events: Event[]) {
  return useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const completedEvents = events.filter(event => event.completed === true);

    const metrics: MeetingMetrics = {
      total: completedEvents.length,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    };

    completedEvents.forEach(event => {
      try {
        const eventDate = parseISO(event.date);
        
        if (isWithinInterval(eventDate, { start: todayStart, end: todayEnd })) {
          metrics.today++;
        }
        
        if (isWithinInterval(eventDate, { start: weekStart, end: weekEnd })) {
          metrics.thisWeek++;
        }
        
        if (isWithinInterval(eventDate, { start: monthStart, end: monthEnd })) {
          metrics.thisMonth++;
        }
      } catch (error) {
        console.error('Error parsing event date:', error);
      }
    });

    return metrics;
  }, [events]);
}
