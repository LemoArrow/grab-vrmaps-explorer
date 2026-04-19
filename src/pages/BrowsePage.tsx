import { useState } from "react";
import { Search, Download, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { searchLevels, downloadLevel, type LevelSearchResult } from "@/lib/grabApi";

const BrowsePage = () => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<LevelSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!term.trim()) {
      toast.error("Enter a search term");
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const data = await searchLevels(term.trim());
      setResults(data);
      if (data.length === 0) toast.info("No levels found");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleDownload = async (r: LevelSearchResult) => {
    const key = `${r.user_id}:${r.iteration}`;
    setDownloadingKey(key);
    try {
      await downloadLevel(r.user_id, r.iteration, r.title);
      toast.success(`Downloaded "${r.title}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-3xl">
          <h1 className="text-2xl font-bold text-foreground mb-1">Browse Levels</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Search GRAB community levels and download them as <code>.level</code> files.
          </p>

          <div className="flex gap-2 mb-6">
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by title, e.g. parkour, lava, climb..."
              className="bg-input text-card-foreground border-border placeholder:text-muted-foreground"
            />
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="bg-primary text-primary-foreground hover:brightness-110"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </div>

          <p className="mb-4 text-sm">
            <span className="font-bold text-destructive">DO NOT STEAL MAPS!</span>{" "}
            <span className="text-muted-foreground">
              Only download levels you have permission to use.
            </span>
          </p>

          {searching && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!searching && hasSearched && results.length === 0 && (
            <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-lg">
              No levels match "{term}".
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((r) => {
              const key = `${r.user_id}:${r.iteration}`;
              const isDownloading = downloadingKey === key;
              return (
                <div
                  key={key}
                  className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-4 shadow-md flex flex-col"
                >
                  <h3 className="font-semibold text-card-foreground truncate">
                    {r.title || "(untitled)"}
                  </h3>
                  {r.creators && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <User className="w-3 h-3 shrink-0" />
                      {r.creators}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono truncate">
                    {key}
                  </p>
                  <Button
                    onClick={() => handleDownload(r)}
                    disabled={isDownloading}
                    size="sm"
                    className="mt-3 bg-primary text-primary-foreground hover:brightness-110"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="ml-2">Download .level</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BrowsePage;
