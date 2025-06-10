
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Key, Settings, Globe } from 'lucide-react';

export default function GoogleMapsInstructions() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Configuração da API do Google Maps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Visão Geral</h4>
            <p className="text-blue-800 text-sm">
              Para importar leads do Google Maps, você precisa configurar uma API Key do Google Cloud Platform.
              Este processo é gratuito para uso básico (até 1000 requisições por mês).
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <Badge className="mb-2 bg-green-100 text-green-800">Passo 1</Badge>
              <h4 className="font-semibold mb-2">Criar Projeto no Google Cloud</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                <li>Acesse <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="w-3 h-3" /></a></li>
                <li>Clique em "Selecionar projeto" e depois "Novo projeto"</li>
                <li>Digite um nome para seu projeto (ex: "CRM-Leads")</li>
                <li>Clique em "Criar"</li>
              </ol>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <Badge className="mb-2 bg-blue-100 text-blue-800">Passo 2</Badge>
              <h4 className="font-semibold mb-2">Ativar APIs Necessárias</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                <li>No menu lateral, vá em "APIs e serviços" → "Biblioteca"</li>
                <li>Pesquise por "Places API" e clique nela</li>
                <li>Clique em "Ativar"</li>
                <li>Repita o processo para "Maps JavaScript API"</li>
                <li>Também ative a "Geocoding API" (para conversão de endereços)</li>
              </ol>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <Badge className="mb-2 bg-purple-100 text-purple-800">Passo 3</Badge>
              <h4 className="font-semibold mb-2">Criar Credenciais (API Key)</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                <li>Vá em "APIs e serviços" → "Credenciais"</li>
                <li>Clique em "+ Criar credenciais" → "Chave de API"</li>
                <li>Sua API Key será criada. <strong>Copie e guarde em local seguro!</strong></li>
                <li>Clique em "Restringir chave" (recomendado para segurança)</li>
              </ol>
            </div>

            <div className="border-l-4 border-orange-500 pl-4">
              <Badge className="mb-2 bg-orange-100 text-orange-800">Passo 4</Badge>
              <h4 className="font-semibold mb-2">Configurar Restrições de Segurança</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                <li>Na página de edição da API Key:</li>
                <li>Em "Restrições de aplicativo", selecione "Referenciadores HTTP"</li>
                <li>Adicione seus domínios permitidos:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><code className="bg-gray-100 px-1 rounded">localhost:*</code> (para desenvolvimento)</li>
                    <li><code className="bg-gray-100 px-1 rounded">seudominio.com/*</code> (para produção)</li>
                  </ul>
                </li>
                <li>Em "Restrições de API", selecione as APIs ativadas</li>
                <li>Clique em "Salvar"</li>
              </ol>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <Badge className="mb-2 bg-red-100 text-red-800">Passo 5</Badge>
              <h4 className="font-semibold mb-2">Configurar Faturamento (Necessário)</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                <li>No menu lateral, vá em "Faturamento"</li>
                <li>Clique em "Vincular conta de faturamento"</li>
                <li>Crie uma nova conta ou vincule uma existente</li>
                <li>Adicione um cartão de crédito (não será cobrado dentro da cota gratuita)</li>
                <li><strong>Importante:</strong> Configure alertas de faturamento para evitar custos inesperados</li>
              </ol>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Informações Importantes</h4>
            <ul className="space-y-1 text-yellow-800 text-sm">
              <li>• <strong>Cota Gratuita:</strong> 1.000 requisições/mês para Places API</li>
              <li>• <strong>Custo adicional:</strong> $17 por 1.000 requisições extras</li>
              <li>• <strong>Segurança:</strong> Sempre configure restrições na sua API Key</li>
              <li>• <strong>Monitoramento:</strong> Configure alertas de uso no Google Cloud</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✅ Após Configurar</h4>
            <p className="text-green-800 text-sm">
              Cole sua API Key no campo correspondente na seção de importação de leads. 
              O sistema irá validar a chave e você poderá começar a importar leads diretamente do Google Maps!
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <Key className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">
              Sua API Key deve ficar similar a: <code className="bg-white px-2 py-1 rounded text-xs">AIzaSyD...</code>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
