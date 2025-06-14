
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, CheckCircle, XCircle, User, Edit, Trash2 } from 'lucide-react';
import { useCrm } from '@/contexts/CrmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Supervision() {
  const { pendingActions, approveAction, rejectAction, loadPendingActions } = useCrm();
  const { profile } = useAuth();

  // Carregar ações pendentes quando a página for montada
  useEffect(() => {
    console.log('Carregando ações pendentes...');
    loadPendingActions();
  }, [loadPendingActions]);

  // Debug log para verificar as ações pendentes
  useEffect(() => {
    console.log('Pending actions na página de supervisão:', pendingActions);
    console.log('Total de ações pendentes:', pendingActions.length);
  }, [pendingActions]);

  // Apenas supervisores e admins podem acessar
  if (profile?.role === 'comercial') {
    return <Navigate to="/" replace />;
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'edit_lead':
      case 'edit_event':
        return <Edit className="w-4 h-4 text-blue-600" />;
      case 'delete_lead':
      case 'delete_event':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <Shield className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'edit_lead':
        return 'Edição de Lead';
      case 'delete_lead':
        return 'Exclusão de Lead';
      case 'edit_event':
        return 'Edição de Evento';
      case 'delete_event':
        return 'Exclusão de Evento';
      default:
        return 'Ação';
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'edit_lead':
      case 'edit_event':
        return 'bg-blue-100 text-blue-800';
      case 'delete_lead':
      case 'delete_event':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Supervisão</h2>
        <p className="text-slate-600">Aprove ou rejeite ações sensíveis realizadas por usuários comerciais</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-orange-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{pendingActions.length}</div>
            <p className="text-sm text-orange-600">ações aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Aprovadas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">0</div>
            <p className="text-sm text-green-600">ações aprovadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-900 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Rejeitadas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">0</div>
            <p className="text-sm text-red-600">ações rejeitadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Ações Pendentes de Aprovação
            <span className="text-sm font-normal text-slate-500">
              ({pendingActions.length} {pendingActions.length === 1 ? 'ação' : 'ações'})
            </span>
          </CardTitle>
          <CardDescription>
            Revise e aprove ou rejeite as solicitações dos usuários comerciais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingActions.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma ação pendente</h3>
              <p className="text-slate-600">Todas as solicitações foram processadas</p>
              <Button 
                variant="outline" 
                onClick={loadPendingActions}
                className="mt-4"
              >
                Atualizar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingActions.map((action) => (
                <div key={action.id} className="border border-slate-200 rounded-lg p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getActionIcon(action.type)}
                        <Badge className={getActionTypeColor(action.type)}>
                          {getActionTypeLabel(action.type)}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <User className="w-3 h-3" />
                          {action.user_name}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="w-3 h-3" />
                          {action.timestamp}
                        </div>
                      </div>

                      <p className="text-slate-700 mb-3">{action.description}</p>

                      {/* Action Details */}
                      {action.details && (
                        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                          <h4 className="font-medium text-slate-900">Detalhes da Solicitação:</h4>
                          {action.details.leadName && (
                            <p className="text-sm text-slate-600">
                              <strong>Lead:</strong> {action.details.leadName}
                            </p>
                          )}
                          {action.details.eventTitle && (
                            <p className="text-sm text-slate-600">
                              <strong>Evento:</strong> {action.details.eventTitle}
                            </p>
                          )}
                          {action.details.changes && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-700">Alterações solicitadas:</p>
                              {Object.entries(action.details.changes).map(([key, value]) => (
                                <p key={key} className="text-sm text-slate-600 ml-2">
                                  <strong>{key}:</strong> {String(value)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => rejectAction(action.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:border-red-200"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        onClick={() => approveAction(action.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
