
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  recipient_id: string;
  message: string;
  sent_at: string;
}

interface MessagesTableProps {
  messages: Message[];
}

export default function MessagesTable({ messages }: MessagesTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-2 p-4">
          {messages.map((message) => (
            <div key={message.id} className="border rounded-lg p-4 hover:bg-slate-50">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-slate-400 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      Destinatário: {message.recipient_id}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(message.sent_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  <p className="text-slate-700">{message.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
