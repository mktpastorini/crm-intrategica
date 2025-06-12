
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get Google Maps API key from system settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('google_maps_api_key')
      .single();

    const googleMapsApiKey = settings?.google_maps_api_key;
    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, niche, import_leads = false } = await req.json();

    if (!query || !niche) {
      return new Response(
        JSON.stringify({ error: 'Query and niche are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for places using Google Maps Places API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=establishment&key=${googleMapsApiKey}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.status !== 'OK') {
      return new Response(
        JSON.stringify({ error: 'Google Maps API error', details: data.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const leads = [];
    
    for (const place of data.results.slice(0, 20)) {
      // Get place details for contact information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating&key=${googleMapsApiKey}`;
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status === 'OK') {
        const placeDetails = detailsData.result;
        
        const leadData = {
          name: 'Contato',
          company: placeDetails.name || place.name,
          phone: placeDetails.formatted_phone_number || 'Não informado',
          email: null,
          niche: niche,
          address: placeDetails.formatted_address || place.formatted_address,
          website: placeDetails.website || null,
          rating: placeDetails.rating || null,
          place_id: place.place_id,
          status: 'novo',
          responsible_id: '00000000-0000-0000-0000-000000000000' // Default user ID
        };

        leads.push(leadData);

        // Import to database if requested
        if (import_leads) {
          await supabase
            .from('leads')
            .insert([leadData]);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leads: leads,
        imported: import_leads,
        count: leads.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-maps-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
