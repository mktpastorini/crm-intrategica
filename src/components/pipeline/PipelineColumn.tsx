
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar, User, Building, Archive, FileText } from 'lucide-react';
import { useCrm } from '@/contexts/CrmContext';
import type { Lead, PipelineStage } from './types';

interface PipelineColumnProps {
  stage: PipelineStage;
  leads: Lead[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}

export default function PipelineColumn({ stage, leads, onDragOver, onDrop, onDragStart }: PipelineColumnProps) {
  const { proposals } = useCrm();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getProposalForLead = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead?.proposal_id) return null;
    return proposals.find(p => p.id === lead.proposal_id);
  };

  // Check if this stage should prevent backward movement
  const isRestrictedStage = stage.name.toLowerCase().includes('proposta') && stage.name.toLowerCase().includes('enviada');

  return (
    <div 
      className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: stage.color }}
            />
            <h3 className="font-semibold text-slate-900">{stage.name}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        {stage.description && (
          <p className="text-xs text-slate-500 mt-1">{stage.description}</p>
        )}
      </div>

      {/* Leads List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {leads.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <Archive className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum lead neste estágio</p>
          </div>
        ) : (
          leads.map((lead) => {
            const proposal = getProposalForLead(lead.id);
            
            return (
              <Card
                key={lead.id}
                className="cursor-move hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => onDragStart(e, lead.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium text-slate-900 line-clamp-1">
                      {lead.name}
                    </CardTitle>
                    <Badge 
                      variant={lead.status === 'novo' ? 'default' : 
                               lead.status === 'qualificado' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {lead.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Building className="w-3 h-3" />
                      <span className="truncate">{lead.company}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3 h-3" />
                      <span>{lead.phone}</span>
                    </div>
                    
                    {lead.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                    )}

                    {/* Show proposal info if linked */}
                    {proposal && (
                      <div className="mt-3 p-2 bg-green-50 rounded-md border border-green-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-medium text-green-800">
                            {proposal.title}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-green-600 mt-1">
                          {formatCurrency(proposal.total_value)}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-slate-500 mt-2">
                      Criado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </div>

                    {/* Warning for restricted stages */}
                    {isRestrictedStage && proposal && (
                      <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-200 mt-2">
                        ⚠️ Este lead não pode retroceder de estágio
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
