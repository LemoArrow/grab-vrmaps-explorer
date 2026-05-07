const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROXY_BASE = "https://ijmowerdujivlvqojroc.supabase.co/functions/v1/grab-proxy";
const PROXY_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbW93ZXJkdWppdmx2cW9qcm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjEzOTcsImV4cCI6MjA5MDgzNzM5N30.55W84VdH_BaYqdBMSole6LLNHETjvkV-iYad4bMJeP8";

const GRAB_API = "https://api.slin.dev/grab/v1";
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
  "Referer": "https://grabvr.quest/",
  "Origin": "https://grabvr.quest",
  "Accept": "application/json",
  "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
};

async function proxyGrabApi(path: string): Promise<Response> {
  const res = await fetch(`${GRAB_API}${path}`, { headers: BROWSER_HEADERS });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // -------- Search action --------
  if (action === "search") {
    const term = url.searchParams.get("term") || "";
    if (!term.trim()) {
      return new Response(JSON.stringify({ error: "Missing 'term' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const params = new URLSearchParams({ action: "search", term });
      const res = await fetch(`${PROXY_BASE}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${PROXY_KEY}`, apikey: PROXY_KEY, Accept: "application/json" },
      });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": res.headers.get("Content-Type") || "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Search proxy error", details: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // -------- User info action --------
  if (action === "user_info") {
    const userId = url.searchParams.get("user_id");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing 'user_id' parameter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      return await proxyGrabApi(`/get_user_info?user_id=${encodeURIComponent(userId)}`);
    } catch (err) {
      return new Response(JSON.stringify({ error: "User info error", details: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // -------- User levels action --------
  if (action === "user_levels") {
    const userId = url.searchParams.get("user_id");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing 'user_id' parameter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      return await proxyGrabApi(`/list?max_format_version=21&user_id=${encodeURIComponent(userId)}`);
    } catch (err) {
      return new Response(JSON.stringify({ error: "User levels error", details: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // -------- Existing details/download passthrough --------
  const userId = url.searchParams.get("user_id");
  const iteration = url.searchParams.get("iteration");
  const version = url.searchParams.get("version");

  if (!action || !userId || !iteration) {
    return new Response(JSON.stringify({ error: "Missing required parameters" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const params = new URLSearchParams({ action, user_id: userId, iteration });
    if (version) params.set("version", version);
    const res = await fetch(`${PROXY_BASE}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${PROXY_KEY}`, apikey: PROXY_KEY },
    });
    const contentType = res.headers.get("Content-Type") || "application/octet-stream";
    const body = contentType.includes("json") ? await res.text() : await res.arrayBuffer();
    return new Response(body, {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": contentType },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Proxy error", details: String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
