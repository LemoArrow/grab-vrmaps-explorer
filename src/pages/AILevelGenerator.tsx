import { useState } from "react";
import { Wand2, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";

const examplePrompts = [
  "A simple parkour course with 10 platforms going upward",
  "A lava floor obstacle course with grapple points on the ceiling",
  "A maze made of ice blocks with bouncy walls",
  "A tower climbing challenge with grabbable blocks and checkpoints",
  "A floating island parkour with moving-style platforms at different heights",
];

const AILevelGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLevel, setGeneratedLevel] = useState<object | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a level description");
      return;
    }

    setLoading(true);
    setGeneratedLevel(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/generate-level`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate level");
      }

      const levelData = await res.json();

      // Override title if user provided one
      if (title.trim()) {
        levelData.title = title.trim();
      }

      setGeneratedLevel(levelData);
      toast.success("Level generated! You can now download it.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate level");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedLevel) return;

    const json = JSON.stringify(generatedLevel);
    const blob = new Blob([json], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName =
      (generatedLevel as any).title?.replace(/[^a-zA-Z0-9]/g, "_") ||
      "ai_level";
    a.download = `${fileName}.level`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Level file downloaded!");
  };

  const nodeCount = generatedLevel
    ? ((generatedLevel as any).nodes?.length ?? 0)
    : 0;

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            AI Level Generator
          </h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Describe a level and AI will build it as a downloadable .level file
        </p>

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl w-full max-w-lg space-y-4">
          {/* Title */}
          <div>
            <label className="block text-card-foreground font-medium text-sm mb-1">
              Level Title (optional)
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Level"
              className="bg-input text-card-foreground border-border"
            />
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-card-foreground font-medium text-sm mb-1">
              Describe your level
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A parkour course with lava below and grapple points..."
              rows={4}
              maxLength={1000}
              className="bg-input text-card-foreground border-border placeholder:text-muted-foreground resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {prompt.length}/1000 characters
            </p>
          </div>

          {/* Example prompts */}
          <div>
            <label className="block text-card-foreground font-medium text-xs mb-2">
              Try an example:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {examplePrompts.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {ex.length > 40 ? ex.slice(0, 40) + "…" : ex}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating level...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Level
              </>
            )}
          </Button>

          {/* Result */}
          {generatedLevel && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-card-foreground font-medium text-sm">
                    {(generatedLevel as any).title || "Generated Level"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {nodeCount} blocks
                  </p>
                </div>
                <Button onClick={handleDownload} size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download .level
                </Button>
              </div>

              {/* Preview of block types used */}
              <details className="text-xs">
                <summary className="text-muted-foreground cursor-pointer hover:text-card-foreground">
                  View raw JSON
                </summary>
                <pre className="mt-2 bg-muted rounded-md p-3 overflow-x-auto max-h-60 overflow-y-auto text-foreground font-mono">
                  {JSON.stringify(generatedLevel, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AILevelGenerator;
