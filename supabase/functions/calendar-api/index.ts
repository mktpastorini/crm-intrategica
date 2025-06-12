
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
    const date = url.searchParams.get('date');

    switch (action) {
      case 'daily':
        if (!date) {
          return new Response(
            JSON.stringify({ error: 'Date is required (YYYY-MM-DD format)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: dailyEvents, error: dailyError } = await supabase
          .from('events')
          .select('*')
          .eq('date', date)
          .order('time', { ascending: true });

        if (dailyError) throw dailyError;

        return new Response(
          JSON.stringify({ success: true, events: dailyEvents, date }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'weekly':
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');

        if (!startDate || !endDate) {
          return new Response(
            JSON.stringify({ error: 'start_date and end_date are required (YYYY-MM-DD format)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: weeklyEvents, error: weeklyError } = await supabase
          .from('events')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (weeklyError) throw weeklyError;

        return new Response(
          JSON.stringify({ 
            success: true, 
            events: weeklyEvents, 
            period: { start_date: startDate, end_date: endDate }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'create':
        const eventData = await req.json();
        
        const { data: newEvent, error: createError } = await supabase
          .from('events')
          .insert([{
            title: eventData.title,
            type: eventData.type,
            date: eventData.date,
            time: eventData.time,
            company: eventData.company || null,
            lead_id: eventData.lead_id || null,
            lead_name: eventData.lead_name || null,
            responsible_id: eventData.responsible_id || '00000000-0000-0000-0000-000000000000'
          }])
          .select()
          .single();

        if (createError) throw createError;

        return new Response(
          JSON.stringify({ success: true, event: newEvent }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: daily, weekly, or create' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in calendar-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
