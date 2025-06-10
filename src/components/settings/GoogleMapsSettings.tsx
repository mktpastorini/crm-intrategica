
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

interface GoogleMapsSettingsProps {
  settings: any;
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
}

export default function GoogleMapsSettings({ settings, onInputChange, onSave }: GoogleMapsSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Configurações do Google Maps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="google-maps-api-key">Chave da API do Google Maps</Label>
          <Input
            id="google-maps-api-key"
            type="password"
            value={settings?.google_maps_api_key || ''}
            onChange={(e) => onInputChange('google_maps_api_key', e.target.value)}
            placeholder="AIzaSy..."
          />
          <p className="text-xs text-slate-500 mt-1">
            Necessária para importar leads do Google Maps. 
            <a 
              href="https://developers.google.com/maps/documentation/places/web-service/get-api-key" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Como obter a chave da API
            </a>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📋 Configuração da API</h4>
          <div className="text-blue-800 text-sm space-y-2">
            <p><strong>1.</strong> Acesse o Google Cloud Console</p>
            <p><strong>2.</strong> Crie um projeto ou selecione um existente</p>
            <p><strong>3.</strong> Ative a API Places</p>
            <p><strong>4.</strong> Crie credenciais (chave da API)</p>
            <p><strong>5.</strong> Configure as restrições de segurança</p>
          </div>
        </div>

        <Button onClick={onSave} className="w-full">
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
