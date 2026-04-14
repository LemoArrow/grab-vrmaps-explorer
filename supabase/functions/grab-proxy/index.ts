const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Proxy through the working reference edge function that handles API signing
const PROXY_BASE = "https://ijmowerdujivlvqojroc.supabase.co/functions/v1/grab-proxy";
const PROXY_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbW93ZXJkdWppdmx2cW9qcm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjEzOTcsImV4cCI6MjA5MDgzNzM5N30.55W84VdH_BaYqdBMSole6LLNHETjvkV-iYad4bMJeP8";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const userId = url.searchParams.get("user_id");
  const iteration = url.searchParams.get("iteration");
  const version = url.searchParams.get("version");

  if (!action || !userId || !iteration) {
    return new Response(JSON.stringify({ error: "Missing required parameters" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const params = new URLSearchParams({ action, user_id: userId, iteration });
    if (version) params.set("version", version);

    const res = await fetch(`${PROXY_BASE}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${PROXY_KEY}`,
        apikey: PROXY_KEY,
      },
    });

    const contentType = res.headers.get("Content-Type") || "application/octet-stream";
    const body = contentType.includes("json")
      ? await res.text()
      : await res.arrayBuffer();

    return new Response(body, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": contentType },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Proxy error", details: String(err) }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
