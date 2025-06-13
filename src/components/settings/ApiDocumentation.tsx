import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Code, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ApiDocumentation() {
  const { toast } = useToast();
  const baseUrl = 'https://gfuoipqwmhfrqhmkqyxp.supabase.co/functions/v1';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "URL copiada para a área de transferência",
    });
  };

  const endpoints = [
    {
      title: "Google Maps Search",
      description: "Busca empresas no Google Maps e opcionalmente importa como leads",
      method: "POST",
      url: `${baseUrl}/google-maps-search`,
      params: {
        query: "string - Termo de busca (ex: 'restaurantes em São Paulo')",
        niche: "string - Nicho do negócio",
        import_leads: "boolean - Se true, importa os resultados como leads"
      },
      example: `{
  "query": "restaurantes em São Paulo",
  "niche": "Alimentação",
  "import_leads": false
}`
    },
    {
      title: "Leads API",
      description: "Gerencia leads no sistema",
      method: "GET/POST",
      url: `${baseUrl}/leads-api`,
      actions: [
        {
          action: "list",
          method: "GET",
          description: "Lista todos os leads",
          url: "?action=list"
        },
        {
          action: "get",
          method: "GET", 
          description: "Busca um lead específico",
          url: "?action=get&id={lead_id}"
        },
        {
          action: "exists",
          method: "POST",
          description: "Verifica se um lead existe",
          url: "?action=exists",
          body: `{
  "company": "Nome da Empresa",
  "phone": "11999999999"
}`
        },
        {
          action: "create",
          method: "POST", 
          description: "Cria um novo lead",
          url: "?action=create",
          body: `{
  "name": "Nome do Contato",
  "company": "Nome da Empresa", 
  "phone": "11999999999",
  "email": "email@empresa.com",
  "niche": "Setor",
  "address": "Endereço completo",
  "website": "https://site.com",
  "responsible_id": "uuid-do-responsavel"
}`
        }
      ]
    },
    {
      title: "Calendar API",
      description: "Gerencia eventos da agenda",
      method: "GET/POST",
      url: `${baseUrl}/calendar-api`,
      actions: [
        {
          action: "daily",
          method: "GET",
          description: "Lista eventos de um dia",
          url: "?action=daily&date=2024-01-15"
        },
        {
          action: "weekly",
          method: "GET",
          description: "Lista eventos de uma semana",
          url: "?action=weekly&start_date=2024-01-15&end_date=2024-01-21"
        },
        {
          action: "create",
          method: "POST",
          description: "Cria um novo evento",
          url: "?action=create",
          body: `{
  "title": "Reunião com cliente",
  "type": "reuniao",
  "date": "2024-01-15",
  "time": "14:30",
  "company": "Empresa ABC",
  "lead_name": "João Silva",
  "responsible_id": "uuid-do-responsavel"
}`
        }
      ]
    },
    {
      title: "Report API",
      description: "Gera relatórios automaticamente baseado no horário",
      method: "GET",
      url: `${baseUrl}/report-api`,
      actions: [
        {
          action: "daily",
          method: "GET",
          description: "Gera relatório diário (padrão)",
          url: "?tipo=dia"
        },
        {
          action: "weekly",
          method: "GET",
          description: "Gera relatório semanal",
          url: "?tipo=semana"
        },
        {
          action: "monthly",
          method: "GET",
          description: "Gera relatório mensal",
          url: "?tipo=mes"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Documentação da API</h3>
        <p className="text-sm text-slate-600">
          Endpoints disponíveis para integração com sistemas externos e IA de atendimento.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Code className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">URL Base da API</span>
        </div>
        <div className="flex items-center gap-2">
          <code className="bg-white px-2 py-1 rounded text-sm border">
            {baseUrl}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(baseUrl)}
            className="h-6 w-6 p-0"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {endpoints.map((endpoint, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{endpoint.title}</CardTitle>
              <Badge variant="outline">{endpoint.method}</Badge>
            </div>
            <p className="text-sm text-slate-600">{endpoint.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Endpoint:</span>
              <code className="bg-slate-100 px-2 py-1 rounded text-sm flex-1">
                {endpoint.url}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(endpoint.url)}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>

            {endpoint.params && (
              <div>
                <h4 className="text-sm font-medium mb-2">Parâmetros:</h4>
                <div className="bg-slate-50 p-3 rounded space-y-1">
                  {Object.entries(endpoint.params).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <code className="text-blue-600">{key}</code>: {value}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {endpoint.example && (
              <div>
                <h4 className="text-sm font-medium mb-2">Exemplo de requisição:</h4>
                <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
                  {endpoint.example}
                </pre>
              </div>
            )}

            {endpoint.actions && (
              <div>
                <h4 className="text-sm font-medium mb-3">Ações disponíveis:</h4>
                <div className="space-y-4">
                  {endpoint.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="border rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {action.method}
                        </Badge>
                        <span className="font-medium text-sm">{action.action}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{action.description}</p>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs flex-1">
                          {endpoint.url}{action.url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${endpoint.url}${action.url}`)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>

                      {action.body && (
                        <div>
                          <span className="text-xs font-medium">Body:</span>
                          <pre className="bg-slate-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                            {action.body}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Respostas da API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Sucesso (200):</h4>
              <pre className="bg-green-50 border border-green-200 p-3 rounded text-xs">
{`{
  "success": true,
  "data": {...},
  // Dados específicos do endpoint
}`}
              </pre>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">Erro (400/500):</h4>
              <pre className="bg-red-50 border border-red-200 p-3 rounded text-xs">
{`{
  "error": "Mensagem de erro detalhada"
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Importante</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• As APIs não requerem autenticação para facilitar integração</li>
          <li>• Configure a chave do Google Maps em Configurações → Google Maps</li>
          <li>• Para usar com IA, integre os endpoints conforme necessário</li>
          <li>• Todas as datas devem estar no formato YYYY-MM-DD</li>
          <li>• Horários no formato HH:MM (24h)</li>
          <li>• Report API reconhece automaticamente o período baseado no parâmetro 'tipo'</li>
        </ul>
      </div>
    </div>
  );
}
