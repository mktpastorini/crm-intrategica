
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Phone } from 'lucide-react';
import type { Lead } from './types';

interface Props {
  leads: Lead[];
}

export default function UnknownStageColumn({ leads }: Props) {
  if (leads.length === 0) return null;

  return (
    <div className="flex-shrink-0 w-80 bg-red-50 rounded-lg border border-red-300 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-red-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-400"/>
          <h3 className="font-semibold text-red-800 text-sm">
            Estágio Desconhecido
          </h3>
          <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {leads.map(lead => (
          <Card
            key={lead.id}
            className="border-red-400 bg-red-100"
            draggable={false}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800">
                {lead.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              <div className="text-xs text-red-900 italic">
                <span className="font-medium">pipeline_stage:</span> {lead.pipeline_stage}
              </div>
              <div className="flex items-center text-xs text-slate-700">
                <Building className="w-3 h-3 mr-1" />
                {lead.company}
              </div>
              <div className="flex items-center text-xs text-slate-700">
                <Phone className="w-3 h-3 mr-1" />
                {lead.phone}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
