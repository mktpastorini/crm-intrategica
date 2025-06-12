
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

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const leadId = url.searchParams.get('id');

    switch (action) {
      case 'list':
        const { data: leads, error: listError } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (listError) throw listError;

        return new Response(
          JSON.stringify({ success: true, leads }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get':
        if (!leadId) {
          return new Response(
            JSON.stringify({ error: 'Lead ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: lead, error: getError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (getError) {
          return new Response(
            JSON.stringify({ success: false, exists: false, error: getError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, exists: true, lead }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'exists':
        const { company, phone } = await req.json();
        
        if (!company && !phone) {
          return new Response(
            JSON.stringify({ error: 'Company or phone is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let query = supabase.from('leads').select('id');
        
        if (company && phone) {
          query = query.or(`company.eq.${company},phone.eq.${phone}`);
        } else if (company) {
          query = query.eq('company', company);
        } else {
          query = query.eq('phone', phone);
        }

        const { data: existingLead } = await query.single();

        return new Response(
          JSON.stringify({ 
            success: true, 
            exists: !!existingLead,
            lead_id: existingLead?.id || null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'create':
        const leadData = await req.json();
        
        const { data: newLead, error: createError } = await supabase
          .from('leads')
          .insert([{
            ...leadData,
            pipeline_stage: 'aguardando-inicio',
            status: leadData.status || 'novo'
          }])
          .select()
          .single();

        if (createError) throw createError;

        return new Response(
          JSON.stringify({ success: true, lead: newLead }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: list, get, exists, or create' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in leads-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
