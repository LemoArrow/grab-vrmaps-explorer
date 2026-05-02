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

/**
 * Extract sublevel identifiers from a level's binary (protobuf) data.
 * Sublevel references are stored as strings like "community:userId:iteration"
 * inside trigger target nodes. We scan the raw bytes for these patterns.
 */
function extractSublevelIds(buffer: ArrayBuffer, mainUserId: string): string[] {
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

  const ids = new Set<string>();

  // Pattern 1: "community:userId:iteration" — extract userId:iteration
  const communityPattern = /community:([a-zA-Z0-9_-]+):(\d{5,})/g;
  let match: RegExpExecArray | null;
  while ((match = communityPattern.exec(text)) !== null) {
    const id = `${match[1]}:${match[2]}`;
    ids.add(id);
  }

  // Pattern 2: direct "userId:iteration" that aren't the main level
  // Look for GRAB-style user IDs (20+ char alphanumeric) followed by timestamp iterations
  const directPattern = /([a-z0-9]{15,}):(\d{10,})/g;
  while ((match = directPattern.exec(text)) !== null) {
    const id = `${match[1]}:${match[2]}`;
    // Skip if it's the main level itself
    if (match[1] !== mainUserId) {
      ids.add(id);
    }
  }

  return Array.from(ids);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function fetchLevelBlob(
  userId: string,
  iteration: string | number,
  version: string | number = "1"
): Promise<Blob> {
  const downloadRes = await fetch(
    `${supabaseUrl}/functions/v1/grab-proxy?action=download&user_id=${userId}&iteration=${iteration}&version=${version}`,
    { headers }
  );
  if (!downloadRes.ok) {
    const err = await downloadRes.json().catch(() => ({}));
    throw new Error(err.error || `Failed to download ${userId}:${iteration}`);
  }
  return downloadRes.blob();
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

  const safeTitle = title.replace(/[^a-zA-Z0-9 ]/g, "_").trim();

  // Download main level
  const mainBlob = await fetchLevelBlob(userId, iteration, version);

  // Trigger main level download
  triggerDownload(mainBlob, `${safeTitle}.level`);

  // Scan for sublevel references
  try {
    const buffer = await mainBlob.arrayBuffer();
    const sublevelIds = extractSublevelIds(buffer, userId);

    if (sublevelIds.length > 0) {
      // Download each subroom with a small delay between downloads
      for (let i = 0; i < sublevelIds.length; i++) {
        const [subUserId, subIteration] = sublevelIds[i].split(":");
        const suffix = sublevelIds.length === 1 ? "Subroom" : `Subroom_${i + 1}`;

        try {
          // Try to get details for the subroom title
          let subVersion: string | number = "1";
          try {
            const subDetailsRes = await fetch(
              `${supabaseUrl}/functions/v1/grab-proxy?action=details&user_id=${subUserId}&iteration=${subIteration}`,
              { headers }
            );
            if (subDetailsRes.ok) {
              const subDetails = await subDetailsRes.json();
              if (subDetails?.iteration) subVersion = subDetails.iteration;
            }
          } catch {
            // use defaults
          }

          const subBlob = await fetchLevelBlob(subUserId, subIteration, subVersion);

          // Small delay so browser doesn't block multiple downloads
          await new Promise((r) => setTimeout(r, 500));
          triggerDownload(subBlob, `${safeTitle} ${suffix}.level`);
        } catch {
          console.warn(`Failed to download subroom ${sublevelIds[i]}`);
        }
      }
    }
  } catch {
    // Subroom extraction failed silently — main level already downloaded
  }
}

export async function downloadByLevelId(levelId: string): Promise<void> {
  const parts = levelId.split(":");
  if (parts.length !== 2) throw new Error("Invalid level ID");
  await downloadLevel(parts[0], parts[1]);
}
