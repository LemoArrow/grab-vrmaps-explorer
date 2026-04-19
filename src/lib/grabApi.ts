const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const headers = { Authorization: `Bearer ${anonKey}`, apikey: anonKey };

export interface LevelSearchResult {
  user_id: string;
  iteration: string | number;
  title: string;
  creators?: string;
}

export function parseLevelId(input: string): string | null {
  const match = input.match(/level=([^&]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]+:\d+$/.test(input)) return input;
  return null;
}

export async function searchLevels(term: string): Promise<LevelSearchResult[]> {
  const res = await fetch(
    `${supabaseUrl}/functions/v1/grab-proxy?action=search&term=${encodeURIComponent(term)}`,
    { headers }
  );
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    if (Array.isArray((data as { results?: unknown[] })?.results)) {
      return (data as { results: LevelSearchResult[] }).results;
    }
    throw new Error("Unexpected search response");
  }
  return data as LevelSearchResult[];
}

export async function downloadLevel(
  userId: string,
  iteration: string | number,
  knownTitle?: string
): Promise<void> {
  let title = knownTitle && knownTitle !== "null" ? knownTitle : `${userId}_${iteration}`;
  let version: string | number = "1";

  // Get details for title/version when not provided
  try {
    const detailsRes = await fetch(
      `${supabaseUrl}/functions/v1/grab-proxy?action=details&user_id=${userId}&iteration=${iteration}`,
      { headers }
    );
    if (detailsRes.ok) {
      const details = await detailsRes.json();
      if (details?.title && details.title !== "null") title = details.title;
      if (details?.iteration) version = details.iteration;
    }
  } catch {
    // fall back to defaults
  }

  const downloadRes = await fetch(
    `${supabaseUrl}/functions/v1/grab-proxy?action=download&user_id=${userId}&iteration=${iteration}&version=${version}`,
    { headers }
  );
  if (!downloadRes.ok) {
    const err = await downloadRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to download ${userId}:${iteration}`);
  }

  const blob = await downloadRes.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.level`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadByLevelId(levelId: string): Promise<void> {
  const parts = levelId.split(":");
  if (parts.length !== 2) throw new Error("Invalid level ID");
  await downloadLevel(parts[0], parts[1]);
}
