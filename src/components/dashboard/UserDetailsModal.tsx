
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, Users, Award, CheckCircle } from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    leads: any[];
    events: any[];
    closedDeals: number;
    totalLeads: number;
    completedMeetings: number;
    scheduledMeetings: number;
  } | null;
}

export default function UserDetailsModal({ isOpen, onClose, userData }: UserDetailsModalProps) {
  if (!userData) return null;

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const conversionRate = userData.totalLeads > 0 ? (userData.closedDeals / userData.totalLeads) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={userData.avatar_url} alt={userData.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                {getUserInitials(userData.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{userData.name}</h2>
              <p className="text-sm text-slate-600">{userData.email}</p>
            </div>
          </DialogTitle>
          <DialogDescription>
            Detalhamento de performance e atividades do usuário
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* KPIs do usuário */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total de Leads</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{userData.totalLeads}</div>
              <p className="text-xs text-blue-600 mt-1">
                Leads sob responsabilidade
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Fechamentos</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{userData.closedDeals}</div>
              <p className="text-xs text-green-600 mt-1">
                Contratos assinados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Reuniões Realizadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{userData.completedMeetings}</div>
              <p className="text-xs text-purple-600 mt-1">
                Eventos concluídos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-orange-600 mt-1">
                Lead para fechamento
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Pipeline do usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Pipeline Pessoal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userData.leads.length > 0 ? (
                (() => {
                  const stageGroups = userData.leads.reduce((acc: any, lead: any) => {
                    const stage = lead.pipeline_stage || 'Sem estágio';
                    acc[stage] = (acc[stage] || 0) + 1;
                    return acc;
                  }, {});

                  return Object.entries(stageGroups).map(([stage, count]: [string, any]) => (
                    <div key={stage} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm font-medium">{stage}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ));
                })()
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nenhum lead atribuído
                </p>
              )}
            </CardContent>
          </Card>

          {/* Agenda do usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reuniões Agendadas</span>
                <Badge variant="outline">{userData.scheduledMeetings}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reuniões Realizadas</span>
                <Badge className="bg-green-100 text-green-800">{userData.completedMeetings}</Badge>
              </div>
              {userData.scheduledMeetings > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Taxa de Conclusão</span>
                    <span>{((userData.completedMeetings / userData.scheduledMeetings) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={(userData.completedMeetings / userData.scheduledMeetings) * 100} 
                    className="h-2" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leads recentes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {userData.leads.slice(0, 5).map((lead: any) => (
              <div key={lead.id} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{lead.company}</p>
                  <p className="text-xs text-slate-600">{lead.name} • {lead.email}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {lead.pipeline_stage || 'Novo'}
                </Badge>
              </div>
            ))}
            {userData.leads.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                Nenhum lead encontrado
              </p>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
