import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a GRAB VR level designer AI. You generate valid .level JSON files for the game GRAB.

## .level JSON format

The top-level structure is:
{
  "formatVersion": 6,
  "title": "<level title>",
  "creators": "AI Generator",
  "description": "<description>",
  "maxCheckpointCount": 10,
  "ampithepiater": {"size": {"x":0,"y":0,"z":0}},
  "nodes": [ ...array of node objects... ]
}

## Node structure
Each node object has:
{
  "levelNodeGroup": <int>,      // block type (see below)
  "levelNodeStatic": <int>,     // material/shape: 0=cube, 1=sphere, 2=cylinder, 3=pyramid, 4=prism
  "isNonStandard": false,
  "position": {"x": <float>, "y": <float>, "z": <float>},
  "rotation": {"x": 0, "y": 0, "z": 0, "w": 1},
  "scale": {"x": <float>, "y": <float>, "z": <float>},
  "color1": {"r": <0-1>, "g": <0-1>, "b": <0-1>, "a": 1}
}

## Block types (levelNodeGroup values)
- 0 = Start (spawn point) — MUST have exactly one
- 1 = Finish (end/goal) — MUST have exactly one
- 2 = Sign (decorative sign)
- 3 = Default block (solid, standard)
- 4 = Grabbable block (player can grab)
- 5 = Ice block (slippery)
- 6 = Lava block (kills on touch)
- 7 = Wood block (breakable)
- 8 = Grapplable block (grapple hook sticks)
- 9 = Grapplable + Lava
- 10 = Bouncy block (bounces player)
- 11 = No-grapple block (grapple slides off)

## Rules
1. ALWAYS include exactly 1 Start node (group 0) and 1 Finish node (group 1)
2. Start position should be at a reasonable spawn height (y ~1-2)
3. Finish should be reachable by jumping/climbing through the level
4. Use varied block types to make levels interesting
5. Scale values represent half-extents (1,1,1 = 2x2x2 meter cube)
6. Position uses Unity coordinates (y is up)
7. Keep levels reasonable in size (under 200 nodes)
8. Make levels fun and playable! Platforms should be reachable by jumping (max ~3-4 units gap)

## Output
Return ONLY the valid JSON object. No markdown, no code fences, no explanation. Just the raw JSON.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Invalid prompt (max 1000 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Design a GRAB VR level based on this description: ${prompt}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited — please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up the response - strip markdown code fences if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    // Validate it's valid JSON
    let levelData;
    try {
      levelData = JSON.parse(jsonStr);
    } catch {
      console.error("AI returned invalid JSON:", jsonStr.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "AI generated invalid level data. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(levelData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-level error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
