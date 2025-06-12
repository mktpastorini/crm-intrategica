
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Search, Import, Users, ExternalLink, AlertCircle, Phone, Globe, MapPinIcon, Star } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface GoogleMapsLead {
  place_id: string;
  name: string;
  formatted_address: string;
  phone?: string;
  website?: string;
  rating?: number;
  business_status: string;
  international_phone_number?: string;
  types?: string[];
  opening_hours?: any;
  reviews?: any[];
  geometry?: any;
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
  const [importLoading, setImportLoading] = useState(false);
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
        fields: [
          'place_id', 
          'name', 
          'formatted_address', 
          'formatted_phone_number', 
          'international_phone_number', 
          'website', 
          'rating', 
          'business_status',
          'types',
          'opening_hours',
          'reviews',
          'geometry'
        ]
      };

      // Fazer a busca
      service.textSearch(request, async (results: any[], status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          console.log('Resultados encontrados:', results.length);
          
          // Para cada resultado, buscar detalhes adicionais
          const detailedResults = await Promise.all(
            results.map(place => getPlaceDetails(service, place.place_id))
          );
          
          const formattedResults = detailedResults
            .filter(place => place !== null)
            .map(place => ({
              place_id: place!.place_id,
              name: place!.name,
              formatted_address: place!.formatted_address,
              phone: place!.formatted_phone_number || place!.international_phone_number || '',
              website: place!.website || '',
              rating: place!.rating || 0,
              business_status: place!.business_status || 'OPERATIONAL',
              international_phone_number: place!.international_phone_number || '',
              types: place!.types || [],
              opening_hours: place!.opening_hours,
              reviews: place!.reviews || [],
              geometry: place!.geometry
            }));
          
          setResults(formattedResults);

          if (formattedResults.length === 0) {
            toast({
              title: "Nenhum resultado",
              description: "Nenhum estabelecimento encontrado com os critérios informados",
            });
          } else {
            toast({
              title: "Busca concluída",
              description: `${formattedResults.length} estabelecimentos encontrados`,
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

  const getPlaceDetails = (service: any, placeId: string): Promise<any> => {
    return new Promise((resolve) => {
      const request = {
        placeId: placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'formatted_phone_number',
          'international_phone_number',
          'website',
          'rating',
          'business_status',
          'types',
          'opening_hours',
          'reviews',
          'geometry'
        ]
      };

      service.getDetails(request, (place: any, status: any) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          resolve(place);
        } else {
          console.warn('Erro ao buscar detalhes do lugar:', placeId, status);
          resolve(null);
        }
      });
    });
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
    if (selectedLeads.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um lead para importar",
        variant: "destructive",
      });
      return;
    }

    try {
      setImportLoading(true);
      
      const leadsToImport = results
        .filter(result => selectedLeads.includes(result.place_id))
        .map(result => {
          // Limpar e formatar o telefone
          let cleanPhone = '';
          let whatsapp = '';
          
          if (result.phone) {
            // Remove caracteres especiais e espaços, mantém apenas números
            cleanPhone = result.phone.replace(/[^\d+]/g, '');
            
            // Se não tem código do país, adiciona +55 para números brasileiros
            if (cleanPhone.length === 11 && !cleanPhone.startsWith('+')) {
              cleanPhone = `+55${cleanPhone}`;
            } else if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
              cleanPhone = `+55${cleanPhone}`;
            }
            
            // O WhatsApp será o mesmo número do telefone
            whatsapp = cleanPhone;
          }

          // Determinar o nicho baseado nos tipos do Google Maps
          let niche = searchData.query || 'Google Maps';
          if (result.types && result.types.length > 0) {
            const primaryType = result.types[0];
            // Traduzir alguns tipos comuns
            const typeTranslations: { [key: string]: string } = {
              'restaurant': 'Restaurante',
              'store': 'Loja',
              'hospital': 'Hospital',
              'school': 'Escola',
              'bank': 'Banco',
              'gas_station': 'Posto de Combustível',
              'pharmacy': 'Farmácia',
              'dentist': 'Dentista',
              'lawyer': 'Advogado',
              'real_estate_agency': 'Imobiliária',
              'car_dealer': 'Concessionária',
              'beauty_salon': 'Salão de Beleza',
              'gym': 'Academia'
            };
            niche = typeTranslations[primaryType] || primaryType.replace(/_/g, ' ') || niche;
          }

          console.log('Preparando lead para importação:', {
            name: result.name,
            company: result.name,
            phone: cleanPhone,
            whatsapp: whatsapp,
            website: result.website,
            address: result.formatted_address,
            rating: result.rating,
            place_id: result.place_id,
            niche: niche
          });

          return {
            name: result.name || 'Nome não informado',
            company: result.name || 'Empresa não informada',
            phone: cleanPhone,
            whatsapp: whatsapp,
            email: '', // Google Maps não fornece email através da API
            website: result.website || '',
            address: result.formatted_address || '',
            rating: result.rating || null,
            place_id: result.place_id,
            niche: niche,
            status: 'novo'
          };
        });

      console.log('Leads preparados para importação:', leadsToImport);

      await onImport(leadsToImport);
      
      // Limpar seleções após importação bem-sucedida
      setResults([]);
      setSelectedLeads([]);
      
      toast({
        title: "Sucesso",
        description: `${leadsToImport.length} leads importados com sucesso`,
      });
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar leads",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
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
                <Button onClick={handleImportSelected} disabled={selectedLeads.length === 0 || importLoading}>
                  {importLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Import className="w-4 h-4 mr-2" />
                      Importar Selecionados ({selectedLeads.length})
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div key={result.place_id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50">
                  <Checkbox
                    checked={selectedLeads.includes(result.place_id)}
                    onCheckedChange={() => handleSelectLead(result.place_id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 text-base">{result.name}</h4>
                      {result.rating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{result.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-600 leading-relaxed">{result.formatted_address}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        {result.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700 font-medium">{result.phone}</span>
                          </div>
                        )}
                        
                        {result.website && (
                          <a 
                            href={result.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                          >
                            <Globe className="w-4 h-4" />
                            Site
                          </a>
                        )}
                        
                        {result.business_status === 'OPERATIONAL' && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                            ✓ Ativo
                          </Badge>
                        )}
                      </div>
                      
                      {result.types && result.types.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-slate-500">Categoria:</span>
                          <Badge variant="secondary" className="text-xs">
                            {result.types[0].replace(/_/g, ' ')}
                          </Badge>
                        </div>
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
