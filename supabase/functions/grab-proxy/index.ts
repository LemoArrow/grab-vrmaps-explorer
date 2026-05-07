const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Proxy through the working reference edge function that handles API signing
const PROXY_BASE = "https://ijmowerdujivlvqojroc.supabase.co/functions/v1/grab-proxy";
const PROXY_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqbW93ZXJkdWppdmx2cW9qcm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNjEzOTcsImV4cCI6MjA5MDgzNzM5N30.55W84VdH_BaYqdBMSole6LLNHETjvkV-iYad4bMJeP8";

// Direct GRAB API
const GRAB_API = "https://api.slin.dev/grab/v1";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // -------- Search action: proxy through signed reference function --------
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
        headers: {
          Authorization: `Bearer ${PROXY_KEY}`,
          apikey: PROXY_KEY,
          Accept: "application/json",
        },
      });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: {
          ...corsHeaders,
          "Content-Type": res.headers.get("Content-Type") || "application/json",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Search proxy error", details: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // -------- User info action: get user profile --------
  if (action === "user_info") {
    const userId = url.searchParams.get("user_id");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing 'user_id' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const res = await fetch(`${GRAB_API}/get_user_info?user_id=${encodeURIComponent(userId)}`, {
        headers: {
          Referer: "https://grabvr.quest/",
          Origin: "https://grabvr.quest",
        },
      });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "User info error", details: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // -------- User levels action: list all levels for a user --------
  if (action === "user_levels") {
    const userId = url.searchParams.get("user_id");
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing 'user_id' parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    try {
      const res = await fetch(`${GRAB_API}/list?max_format_version=21&user_id=${encodeURIComponent(userId)}`, {
        headers: {
          Referer: "https://grabvr.quest/",
          Origin: "https://grabvr.quest",
        },
      });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "User levels error", details: String(err) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // -------- Existing details/download passthrough --------
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
