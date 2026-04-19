import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { parseLevelId, downloadByLevelId } from "@/lib/grabApi";

const SingleDownload = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    const levelId = parseLevelId(url.trim());
    if (!levelId) {
      toast.error("Invalid level URL or ID format");
      return;
    }
    setLoading(true);
    try {
      await downloadByLevelId(levelId);
      toast.success("Level downloaded!");
    } catch {
      toast.error("Failed to download level. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl w-full max-w-lg">
      <div>
        <label className="block text-card-foreground font-medium mb-2">Level URL or ID</label>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://grabvr.quest/levels/viewer/?level=..."
            className="bg-input text-card-foreground border-border placeholder:text-muted-foreground"
            onKeyDown={(e) => e.key === "Enter" && handleDownload()}
          />
          <Button
            onClick={handleDownload}
            disabled={loading}
            className="bg-primary text-primary-foreground hover:brightness-110 px-3"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        <div className="mt-3 text-muted-foreground text-xs space-y-1">
          <p>Accepted formats:</p>
          <p>→ https://grabvr.quest/levels/viewer/?level=id:iteration</p>
          <p>→ user_id:iteration</p>
        </div>
      </div>
    </div>
  );
};

const MultiDownload = () => {
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);

  const handleParse = async () => {
    const ids = urls
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map(parseLevelId)
      .filter(Boolean) as string[];

    if (ids.length === 0) {
      toast.error("No valid level URLs found");
      return;
    }

    setLoading(true);
    let success = 0;
    for (const id of ids) {
      try {
        await downloadByLevelId(id);
        success++;
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        toast.error(`Failed: ${id}`);
      }
    }
    setLoading(false);
    toast.success(`Downloaded ${success}/${ids.length} levels`);
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl w-full max-w-lg">
      <div>
        <label className="block text-card-foreground font-medium mb-2">
          Paste level URLs (one per line)
        </label>
        <Textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={"https://grabvr.quest/levels/viewer/?level=...\nhttps://grabvr.quest/levels/viewer/?level=...\nabc123:1234567890"}
          rows={5}
          className="bg-input text-card-foreground border-border placeholder:text-muted-foreground resize-y"
        />
        <p className="mt-2 text-sm">
          <span className="font-bold text-destructive">DO NOT STEAL MAPS!</span>{" "}
          <span className="text-muted-foreground">Only download levels you have permission to use.</span>
        </p>
        <Button
          onClick={handleParse}
          disabled={loading}
          className="mt-4 w-full bg-primary text-primary-foreground hover:brightness-110"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Parse Links
        </Button>
      </div>
    </div>
  );
};

const DownloadPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "single";

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="flex rounded-lg overflow-hidden shadow-md mb-6">
          <button
            onClick={() => setSearchParams({})}
            className={`px-6 py-2.5 font-semibold text-sm transition-colors ${
              tab === "single"
                ? "bg-primary text-primary-foreground"
                : "bg-card/60 text-card-foreground hover:bg-card/80"
            }`}
          >
            Single Download
          </button>
          <button
            onClick={() => setSearchParams({ tab: "multi" })}
            className={`px-6 py-2.5 font-semibold text-sm transition-colors ${
              tab === "multi"
                ? "bg-primary text-primary-foreground"
                : "bg-card/60 text-card-foreground hover:bg-card/80"
            }`}
          >
            Multi Download
          </button>
        </div>
        {tab === "single" ? <SingleDownload /> : <MultiDownload />}
      </div>
    </Layout>
  );
};

export default DownloadPage;
