import { useState } from "react";
import { Search, Download, Loader2, User, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { downloadLevel } from "@/lib/grabApi";

const UserLevels = () => {
  const [userId, setUserId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [downloading, setDownloading] = useState(false);

  const parseUserId = (input: string): string => {
    const match = input.match(/user_id=([^&]+)/);
    if (match) return match[1];
    return input.trim();
  };

  const parseLevelId = (input: string): { uid: string; iter: string } | null => {
    // From URL like ?level=uid:iter
    const match = input.match(/level=([^&:]+):(\d+)/);
    if (match) return { uid: match[1], iter: match[2] };
    // Direct format uid:iter
    const parts = input.trim().split(":");
    if (parts.length === 2 && parts[1].match(/^\d+$/)) return { uid: parts[0], iter: parts[1] };
    return null;
  };

  const handleOpenBrowser = () => {
    const id = parseUserId(userId);
    if (!id) {
      toast.error("Enter a user ID or profile URL");
      return;
    }
    window.open(`https://grabvr.quest/levels/?tab=tab_other_user&user_id=${encodeURIComponent(id)}`, "_blank");
  };

  const handleDownloadLevel = async () => {
    const parsed = parseLevelId(levelId);
    if (!parsed) {
      toast.error("Enter a valid level ID (user_id:iteration) or level URL");
      return;
    }
    setDownloading(true);
    try {
      await downloadLevel(parsed.uid, parsed.iter);
      toast.success("Level downloaded!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-bold text-foreground mb-1">User Level Finder</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Search a GRAB user to find all their maps including unpublished ones, and download any level by ID.
          </p>

          {/* Section 1: Browse User Levels */}
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-5 mb-6 shadow-md">
            <h2 className="text-lg font-semibold text-card-foreground mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Browse User's Levels
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter a user ID or profile URL to view all their levels (published &amp; unpublished) in the official GRAB level browser.
            </p>
            <div className="flex gap-2">
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOpenBrowser()}
                placeholder="User ID or grabvr.quest profile URL..."
                className="bg-input text-card-foreground border-border placeholder:text-muted-foreground"
              />
              <Button onClick={handleOpenBrowser}>
                <ExternalLink className="w-4 h-4" />
                <span className="ml-2 hidden sm:inline">Open</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              💡 Tip: On the GRAB level browser, you can see levels that aren't publicly searchable. Copy any level ID from there and paste it below to download.
            </p>
          </div>

          {/* Section 2: Download by Level ID */}
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-5 mb-6 shadow-md">
            <h2 className="text-lg font-semibold text-card-foreground mb-1 flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Download Any Level by ID
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Download any level including unpublished ones — just paste the level ID or viewer URL.
            </p>
            <div className="flex gap-2">
              <Input
                value={levelId}
                onChange={(e) => setLevelId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDownloadLevel()}
                placeholder="user_id:iteration or grabvr.quest/levels/viewer/?level=..."
                className="bg-input text-card-foreground border-border placeholder:text-muted-foreground"
              />
              <Button onClick={handleDownloadLevel} disabled={downloading}>
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Download</span>
              </Button>
            </div>
          </div>

          {/* Section 3: How to find unpublished maps */}
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-5 shadow-md">
            <h2 className="text-lg font-semibold text-card-foreground mb-2 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-primary" />
              How to Find Unpublished Maps
            </h2>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Get the user's ID from their GRAB profile URL</li>
              <li>Click "Open" above to view their level browser page</li>
              <li>Any level shown there that doesn't appear in search results is unpublished/unlisted</li>
              <li>Copy the level ID from the URL (format: <code className="text-xs bg-muted px-1 py-0.5 rounded">user_id:iteration</code>)</li>
              <li>Paste it in the download box above to grab the <code className="text-xs bg-muted px-1 py-0.5 rounded">.level</code> file</li>
            </ol>
          </div>

          <p className="mt-6 text-sm text-center">
            <span className="font-bold text-destructive">DO NOT STEAL MAPS!</span>{" "}
            <span className="text-muted-foreground">
              Only download levels you have permission to use.
            </span>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default UserLevels;
