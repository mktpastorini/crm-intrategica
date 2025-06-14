
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Supabase config missing" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Busca mensagens agendadas não enviadas
  const now = new Date().toISOString();
  const { data: schedules, error } = await supabase
    .from("journey_message_schedules")
    .select("*")
    .is("sent_at", null)
    .lte("scheduled_for", now);

  if (error) {
    console.log("[Journey Cron] Erro ao buscar agendamentos:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }

  if (!schedules || schedules.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, message: "Nenhum agendamento pendente" }),
      { status: 200, headers: corsHeaders }
    );
  }

  let sentCount = 0;
  for (const sch of schedules) {
    if (!sch.webhook_url) continue;
    const payload = {
      lead_id: sch.lead_id,
      lead_name: sch.lead_name,
      lead_phone: sch.lead_phone,
      lead_email: sch.lead_email,
      stage: sch.stage,
      message_title: sch.message_title,
      message_content: sch.message_content,
      message_type: sch.message_type,
      media_url: sch.media_url,
      scheduled_for: sch.scheduled_for,
    };

    try {
      const resp = await fetch(sch.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        console.log(
          `[Journey Cron] Falha ao enviar para ${sch.webhook_url}: ${resp.status}`
        );
      } else {
        sentCount++;
      }
    } catch (err) {
      console.log(`[Journey Cron] Erro ao enviar webhook: ${err}`);
    }

    // Marca como enviado independente do resultado (pode melhorar para só marcar se sucesso)
    await supabase
      .from("journey_message_schedules")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", sch.id);
  }

  return new Response(
    JSON.stringify({ ok: true, sent: sentCount }),
    { headers: corsHeaders }
  );
});
