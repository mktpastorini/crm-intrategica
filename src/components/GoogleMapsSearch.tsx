
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Search, Import, Users, ExternalLink } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface GoogleMapsLead {
  place_id: string;
  name: string;
  formatted_address: string;
  phone?: string;
  website?: string;
  rating?: number;
  business_status: string;
}

interface GoogleMapsSearchProps {
  apiKey: string;
  onImport: (leads: any[]) => Promise<void>;
}

export default function GoogleMapsSearch({ apiKey, onImport }: GoogleMapsSearchProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchData, setSearchData] = useState({
    query: '',
    location: '',
    radius: '5000'
  });
  const [results, setResults] = useState<GoogleMapsLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const searchPlaces = async () => {
    if (!searchData.query || !searchData.location) {
      toast({
        title: "Erro",
        description: "Preencha a palavra-chave e localização",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Buscando lugares no Google Maps...', searchData);
      
      // Busca de lugares usando a API do Google Places
      const searchQuery = `${searchData.query} in ${searchData.location}`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&radius=${searchData.radius}&key=${apiKey}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        throw new Error('Erro na busca do Google Maps');
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(data.error_message || 'Erro na API do Google Maps');
      }

      console.log('Resultados encontrados:', data.results?.length || 0);
      setResults(data.results || []);

      if (!data.results || data.results.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Nenhum estabelecimento encontrado com os critérios informados",
        });
      }
    } catch (error: any) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: error.message || "Erro ao buscar no Google Maps. Verifique a chave da API.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLead = (placeId: string) => {
    setSelectedLeads(prev => 
      prev.includes(placeId) 
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === results.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(results.map(r => r.place_id));
    }
  };

  const handleImportSelected = async () => {
    const leadsToImport = results
      .filter(result => selectedLeads.includes(result.place_id))
      .map(result => ({
        name: result.name,
        company: result.name,
        phone: result.phone || '',
        email: '',
        niche: searchData.query,
        status: 'novo',
        address: result.formatted_address,
        website: result.website || '',
        rating: result.rating || 0
      }));

    if (leadsToImport.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um lead para importar",
        variant: "destructive",
      });
      return;
    }

    await onImport(leadsToImport);
    setResults([]);
    setSelectedLeads([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Buscar no Google Maps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="query">Palavra-chave/Categoria</Label>
              <Input
                id="query"
                value={searchData.query}
                onChange={(e) => setSearchData(prev => ({ ...prev, query: e.target.value }))}
                placeholder="ex: dentista, restaurante, advogado"
              />
            </div>
            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={searchData.location}
                onChange={(e) => setSearchData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="ex: São Paulo, SP"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="radius">Raio (metros)</Label>
            <Input
              id="radius"
              type="number"
              value={searchData.radius}
              onChange={(e) => setSearchData(prev => ({ ...prev, radius: e.target.value }))}
              placeholder="5000"
            />
          </div>
          <Button onClick={searchPlaces} disabled={loading} className="w-full">
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Buscar Estabelecimentos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Resultados Encontrados ({results.length})
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedLeads.length === results.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
                <Button onClick={handleImportSelected} disabled={selectedLeads.length === 0}>
                  <Import className="w-4 h-4 mr-2" />
                  Importar Selecionados ({selectedLeads.length})
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div key={result.place_id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedLeads.includes(result.place_id)}
                    onCheckedChange={() => handleSelectLead(result.place_id)}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{result.name}</h4>
                    <p className="text-sm text-slate-600">{result.formatted_address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {result.phone && (
                        <Badge variant="outline" className="text-xs">
                          📞 {result.phone}
                        </Badge>
                      )}
                      {result.rating && (
                        <Badge variant="outline" className="text-xs">
                          ⭐ {result.rating}
                        </Badge>
                      )}
                      {result.business_status === 'OPERATIONAL' && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          Ativo
                        </Badge>
                      )}
                      {result.website && (
                        <a 
                          href={result.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Site
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
