
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCrm } from '@/contexts/CrmContext';

interface ExportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: any[];
  users: any[];
  pipelineStages: any[];
}

export default function ExportLeadsDialog({
  open,
  onOpenChange,
  leads,
  users,
  pipelineStages
}: ExportLeadsDialogProps) {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    responsible: 'all',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    pipelineStage: 'all'
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Não atribuído';
  };

  const getStageName = (stageId: string) => {
    const stage = pipelineStages.find(s => s.id === stageId);
    return stage?.name || stageId;
  };

  const handleExport = () => {
    try {
      // Filtrar leads baseado nos critérios selecionados
      let filteredLeads = [...leads];

      // Filtro por responsável
      if (filters.responsible !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.responsible_id === filters.responsible);
      }

      // Filtro por data de criação
      if (filters.startDate) {
        filteredLeads = filteredLeads.filter(lead => 
          new Date(lead.created_at) >= filters.startDate!
        );
      }

      if (filters.endDate) {
        filteredLeads = filteredLeads.filter(lead => 
          new Date(lead.created_at) <= filters.endDate!
        );
      }

      // Filtro por estágio do pipeline
      if (filters.pipelineStage !== 'all') {
        filteredLeads = filteredLeads.filter(lead => lead.pipeline_stage === filters.pipelineStage);
      }

      // Preparar dados para CSV
      const csvHeaders = [
        'Nome',
        'Empresa',
        'Telefone',
        'WhatsApp',
        'Email',
        'Website',
        'Instagram',
        'Endereço',
        'Nicho',
        'Status',
        'Estágio Pipeline',
        'Responsável',
        'Data Criação',
        'Avaliação'
      ];

      const csvData = filteredLeads.map(lead => [
        lead.name || '',
        lead.company || '',
        lead.phone || '',
        lead.whatsapp || '',
        lead.email || '',
        lead.website || '',
        lead.instagram || '',
        lead.address || '',
        lead.niche || '',
        lead.status || '',
        getStageName(lead.pipeline_stage),
        getUserName(lead.responsible_id),
        lead.created_at ? format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm') : '',
        lead.rating || ''
      ]);

      // Criar conteúdo CSV
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map(row => 
          row.map(field => 
            typeof field === 'string' && field.includes(',') 
              ? `"${field.replace(/"/g, '""')}"` 
              : field
          ).join(',')
        )
      ].join('\n');

      // Fazer download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Nome do arquivo com timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `leads_export_${timestamp}.csv`;
      link.setAttribute('download', filename);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: `${filteredLeads.length} leads exportados para ${filename}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os leads. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Leads</DialogTitle>
          <DialogDescription>
            Configure os filtros para exportar os leads desejados em formato CSV
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filtro por Responsável */}
          <div>
            <Label htmlFor="responsible">Responsável</Label>
            <Select 
              value={filters.responsible} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, responsible: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtro por Estágio do Pipeline */}
          <div>
            <Label htmlFor="pipeline-stage">Estágio do Pipeline</Label>
            <Select 
              value={filters.pipelineStage} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, pipelineStage: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estágios</SelectItem>
                {pipelineStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleExport} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
