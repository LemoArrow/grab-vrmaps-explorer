import { useState } from "react";
import { Search, Download, Loader2, User, Eye, EyeOff, Calendar, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { downloadLevel } from "@/lib/grabApi";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const headers = { Authorization: `Bearer ${anonKey}`, apikey: anonKey };

interface GrabLevel {
  identifier: string;
  title: string;
  complexity: number;
  format_version: number;
  update_timestamp: number;
  creation_timestamp: number;
  data_key: string;
  description?: string;
  creators?: string[];
  tags?: string[];
  verification_time?: number;
  statistics?: {
    total_played: number;
    difficulty: number;
    liked: number;
    time: number;
    difficulty_string: string;
  };
  images?: {
    thumb?: { key: string };
    full?: { key: string };
  };
  user_name?: string;
}

interface UserInfo {
  user_id: string;
  user_name: string;
  is_admin: boolean;
  is_moderator: boolean;
  is_developer: boolean;
  is_creator: boolean;
  is_verifier: boolean;
  user_level_count: number;
}

const UserLevels = () => {
  const [userId, setUserId] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [levels, setLevels] = useState<GrabLevel[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unpublished">("all");

  const parseUserId = (input: string): string => {
    // Extract user_id from URLs like https://grabvr.quest/player?user_id=XXX
    const match = input.match(/user_id=([^&]+)/);
    if (match) return match[1];
    return input.trim();
  };

  const handleSearch = async () => {
    const id = parseUserId(userId);
    if (!id) {
      toast.error("Enter a user ID or profile URL");
      return;
    }
    setSearching(true);
    setHasSearched(true);
    setUserInfo(null);
    setLevels([]);

    try {
      // Fetch user info and levels in parallel
      const [infoRes, levelsRes] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/grab-proxy?action=user_info&user_id=${encodeURIComponent(id)}`, { headers }),
        fetch(`${supabaseUrl}/functions/v1/grab-proxy?action=user_levels&user_id=${encodeURIComponent(id)}`, { headers }),
      ]);

      if (infoRes.ok) {
        const info = await infoRes.json();
        setUserInfo(info);
      }

      if (levelsRes.ok) {
        const data = await levelsRes.json();
        if (Array.isArray(data)) {
          setLevels(data);
          // Compare listed levels vs expected count to identify unpublished
          const info = userInfo;
          toast.success(`Found ${data.length} levels`);
        } else {
          toast.error("Unexpected response format");
        }
      } else {
        toast.error("Failed to fetch levels");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async (level: GrabLevel) => {
    const [uid, iteration] = level.identifier.split(":");
    setDownloadingKey(level.identifier);
    try {
      await downloadLevel(uid, iteration, level.title);
      toast.success(`Downloaded "${level.title}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadingKey(null);
    }
  };

  // Levels without statistics are likely unpublished/unlisted
  const unpublishedLevels = levels.filter((l) => !l.statistics || l.statistics.total_played === 0);
  const displayLevels = filter === "unpublished" ? unpublishedLevels : levels;

  const formatDate = (ts: number) => {
    if (!ts) return "Unknown";
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <h1 className="text-2xl font-bold text-foreground mb-1">User Level Finder</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Search a GRAB user to find all their maps, including unpublished ones.
          </p>

          <div className="flex gap-2 mb-6">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter user ID or profile URL..."
              className="bg-input text-card-foreground border-border placeholder:text-muted-foreground"
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </div>

          {/* User Info Card */}
          {userInfo && (
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 mb-6 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-card-foreground">{userInfo.user_name}</h2>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {userInfo.is_developer && (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">Developer</span>
                    )}
                    {userInfo.is_admin && (
                      <span className="text-xs bg-chart-1/20 text-chart-1 px-2 py-0.5 rounded-full">Admin</span>
                    )}
                    {userInfo.is_moderator && (
                      <span className="text-xs bg-chart-2/20 text-chart-2 px-2 py-0.5 rounded-full">Moderator</span>
                    )}
                    {userInfo.is_creator && (
                      <span className="text-xs bg-chart-3/20 text-chart-3 px-2 py-0.5 rounded-full">Creator</span>
                    )}
                    {userInfo.is_verifier && (
                      <span className="text-xs bg-chart-4/20 text-chart-4 px-2 py-0.5 rounded-full">Verifier</span>
                    )}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-primary">{userInfo.user_level_count}</p>
                  <p className="text-xs text-muted-foreground">Total Levels</p>
                </div>
              </div>
              {levels.length > 0 && unpublishedLevels.length > 0 && (
                <div className="mt-3 p-2 bg-accent/50 rounded text-sm text-accent-foreground">
                  <EyeOff className="w-4 h-4 inline mr-1" />
                  {unpublishedLevels.length} potentially unpublished/unplayed level{unpublishedLevels.length !== 1 ? "s" : ""} found
                </div>
              )}
            </div>
          )}

          {/* Filter Tabs */}
          {levels.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                <Eye className="w-4 h-4 mr-1" />
                All ({levels.length})
              </Button>
              <Button
                variant={filter === "unpublished" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("unpublished")}
              >
                <EyeOff className="w-4 h-4 mr-1" />
                Unpublished ({unpublishedLevels.length})
              </Button>
            </div>
          )}

          {searching && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!searching && hasSearched && levels.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
              No levels found for this user.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {displayLevels.map((level) => {
              const isDownloading = downloadingKey === level.identifier;
              const thumbUrl = level.images?.thumb?.key
                ? `https://grab-images.slin.dev/${level.images.thumb.key}`
                : null;
              const isUnpublished = !level.statistics || level.statistics.total_played === 0;

              return (
                <div
                  key={level.identifier}
                  className="bg-card/80 backdrop-blur-sm border border-border rounded-lg overflow-hidden shadow-md flex flex-col"
                >
                  {thumbUrl && (
                    <img
                      src={thumbUrl}
                      alt={level.title}
                      className="w-full h-36 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-card-foreground truncate">
                        {level.title || "(untitled)"}
                      </h3>
                      {isUnpublished && (
                        <span className="shrink-0 text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                          Unpublished
                        </span>
                      )}
                    </div>
                    {level.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{level.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                      {level.creators && level.creators.length > 0 && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {level.creators.join(", ")}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(level.creation_timestamp)}
                      </span>
                      {level.statistics && (
                        <span className="flex items-center gap-1">
                          <Gamepad2 className="w-3 h-3" /> {level.statistics.total_played.toLocaleString()} plays
                        </span>
                      )}
                    </div>
                    {level.tags && level.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {level.tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {level.statistics?.difficulty_string && (
                      <span className="mt-2 text-[11px] font-medium text-accent-foreground">
                        Difficulty: {level.statistics.difficulty_string}
                      </span>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono truncate">
                      {level.identifier}
                    </p>
                    <Button
                      onClick={() => handleDownload(level)}
                      disabled={isDownloading}
                      size="sm"
                      className="mt-3"
                    >
                      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span className="ml-2">Download .level</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserLevels;
