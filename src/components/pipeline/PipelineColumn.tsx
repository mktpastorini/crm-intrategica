
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Building, Phone, Mail, User } from 'lucide-react';
import type { Lead, PipelineStage } from './types';
import { DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  stage: PipelineStage;
  leads: Lead[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}

export default function PipelineColumn({
  stage,
  leads,
  onDragOver,
  onDrop,
  onDragStart,
}: Props) {
  const [proposalValues, setProposalValues] = useState<Record<string, number>>({});

  useEffect(() => {
    loadProposalValues();
  }, [leads]);

  const loadProposalValues = async () => {
    const leadsWithProposals = leads.filter(lead => (lead as any).proposal_id);
    if (leadsWithProposals.length === 0) return;

    try {
      const proposalIds = leadsWithProposals.map(lead => (lead as any).proposal_id).filter(Boolean);
      
      const { data: proposals, error } = await supabase
        .from('proposals')
        .select('id, total_value')
        .in('id', proposalIds);

      if (error) throw error;

      const valueMap: Record<string, number> = {};
      proposals?.forEach(proposal => {
        const lead = leadsWithProposals.find(l => (l as any).proposal_id === proposal.id);
        if (lead) {
          valueMap[lead.id] = proposal.total_value;
        }
      });

      setProposalValues(valueMap);
    } catch (error) {
      console.error('Erro ao carregar valores das propostas:', error);
    }
  };

  return (
    <div
      className="flex-shrink-0 w-80 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="font-semibold text-slate-900 text-sm">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {leads.map(lead => (
          <Card
            key={lead.id}
            className="cursor-move hover:shadow-md transition-shadow bg-white border border-slate-200"
            draggable
            onDragStart={(e) => onDragStart(e, lead.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-900">{lead.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center text-xs text-slate-600">
                <Building className="w-3 h-3 mr-1" />
                {lead.company}
              </div>
              <div className="flex items-center text-xs text-slate-600">
                <Phone className="w-3 h-3 mr-1" />
                {lead.phone}
              </div>
              {lead.email && (
                <div className="flex items-center text-xs text-slate-600">
                  <Mail className="w-3 h-3 mr-1" />
                  {lead.email}
                </div>
              )}
              
              {/* Mostrar valor da proposta se existe */}
              {proposalValues[lead.id] && (
                <div className="flex items-center justify-center p-2 bg-green-50 rounded-md border border-green-200">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 font-semibold">
                    <DollarSign className="w-3 h-3 mr-1" />
                    R$ {proposalValues[lead.id].toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Badge variant="outline" className="text-xs">
                  {lead.niche}
                </Badge>
                <div className="flex items-center text-xs text-slate-500">
                  <User className="w-3 h-3 mr-1" />
                  {lead.responsible_id}
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 h-6 w-6 p-0">
                  <Archive className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {leads.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">Nenhum lead neste estágio</div>
        )}
      </div>
    </div>
  );
}
