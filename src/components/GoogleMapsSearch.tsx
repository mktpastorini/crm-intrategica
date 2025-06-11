
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Search, Import, Users, ExternalLink, AlertCircle } from 'lucide-react';
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

// Declare global google object
declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
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
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Load Google Maps API
  const loadGoogleMapsAPI = () => {
    if (window.google) {
      setGoogleMapsLoaded(true);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setGoogleMapsLoaded(true);
        resolve(true);
      };
      script.onerror = () => {
        reject(new Error('Erro ao carregar Google Maps API'));
      };
      document.head.appendChild(script);
    });
  };

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
      console.log('Carregando Google Maps API...');
      
      await loadGoogleMapsAPI();
      
      console.log('Buscando lugares no Google Maps...', searchData);
      
      // Criar um mapa temporário (invisível) para usar o PlacesService
      const map = new window.google.maps.Map(document.createElement('div'));
      const service = new window.google.maps.places.PlacesService(map);
      
      // Configurar request para busca de texto
      const request = {
        query: `${searchData.query} ${searchData.location}`,
        fields: ['place_id', 'name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'business_status']
      };

      // Fazer a busca
      service.textSearch(request, (results: any[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          console.log('Resultados encontrados:', results.length);
          
          const formattedResults = results.map(place => ({
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            phone: place.formatted_phone_number || '',
            website: place.website || '',
            rating: place.rating || 0,
            business_status: place.business_status || 'OPERATIONAL'
          }));
          
          setResults(formattedResults);

          if (formattedResults.length === 0) {
            toast({
              title: "Nenhum resultado",
              description: "Nenhum estabelecimento encontrado com os critérios informados",
            });
          }
        } else {
          console.error('Erro na busca:', status);
          toast({
            title: "Erro na busca",
            description: "Erro ao buscar no Google Maps. Verifique a chave da API e tente novamente.",
            variant: "destructive",
          });
        }
        setLoading(false);
      });
    } catch (error: any) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro na busca",
        description: error.message || "Erro ao buscar no Google Maps. Verifique a chave da API.",
        variant: "destructive",
      });
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
          {!googleMapsLoaded && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <p className="text-blue-800 text-sm">
                  A API do Google Maps será carregada automaticamente quando você fizer a primeira busca.
                </p>
              </div>
            </div>
          )}
          
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
