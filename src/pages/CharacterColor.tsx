import { useState } from "react";
import { Paintbrush, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";

const presetColors = [
  { name: "Red", hex: "#FF0000" },
  { name: "Orange", hex: "#FF8C00" },
  { name: "Yellow", hex: "#FFD700" },
  { name: "Green", hex: "#00C853" },
  { name: "Cyan", hex: "#00BCD4" },
  { name: "Blue", hex: "#2979FF" },
  { name: "Purple", hex: "#7C4DFF" },
  { name: "Pink", hex: "#FF4081" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
];

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

function hexToNormalized(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return {
    r: +(rgb.r / 255).toFixed(4),
    g: +(rgb.g / 255).toFixed(4),
    b: +(rgb.b / 255).toFixed(4),
  };
}

const CharacterColor = () => {
  const [hex, setHex] = useState("#FF8C00");
  const [copied, setCopied] = useState<string | null>(null);

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(hex);
  const rgb = isValidHex ? hexToRgb(hex) : null;
  const normalized = isValidHex ? hexToNormalized(hex) : null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Copied ${label}!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleHexChange = (value: string) => {
    let v = value.toUpperCase();
    if (!v.startsWith("#")) v = "#" + v;
    if (v.length <= 7) setHex(v);
  };

  const jsonSnippet = normalized
    ? `"customColor": {\n  "r": ${normalized.r},\n  "g": ${normalized.g},\n  "b": ${normalized.b},\n  "a": 1\n}`
    : "";

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Paintbrush className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Character Color Picker</h1>
        </div>

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl w-full max-w-lg space-y-6">
          {/* Color preview */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-lg border-2 border-border shadow-inner"
              style={{ backgroundColor: isValidHex ? hex : "#000" }}
            />
            <div className="flex-1 space-y-2">
              <label className="block text-card-foreground font-medium text-sm">Hex Color</label>
              <div className="flex gap-2">
                <Input
                  value={hex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#FF8C00"
                  maxLength={7}
                  className="bg-input text-card-foreground border-border font-mono"
                />
                <input
                  type="color"
                  value={isValidHex ? hex : "#000000"}
                  onChange={(e) => setHex(e.target.value.toUpperCase())}
                  className="w-10 h-10 rounded cursor-pointer border border-border"
                />
              </div>
            </div>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-card-foreground font-medium text-sm mb-2">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setHex(c.hex)}
                  title={c.name}
                  className="w-8 h-8 rounded-md border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: hex === c.hex ? "hsl(var(--primary))" : "hsl(var(--border))",
                  }}
                />
              ))}
            </div>
          </div>

          {/* RGB Info */}
          {rgb && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted rounded-md p-2 text-center">
                <span className="block text-xs text-muted-foreground">R</span>
                <span className="font-mono font-bold text-foreground">{rgb.r}</span>
              </div>
              <div className="bg-muted rounded-md p-2 text-center">
                <span className="block text-xs text-muted-foreground">G</span>
                <span className="font-mono font-bold text-foreground">{rgb.g}</span>
              </div>
              <div className="bg-muted rounded-md p-2 text-center">
                <span className="block text-xs text-muted-foreground">B</span>
                <span className="font-mono font-bold text-foreground">{rgb.b}</span>
              </div>
            </div>
          )}

          {/* JSON snippet */}
          {normalized && (
            <div>
              <label className="block text-card-foreground font-medium text-sm mb-2">
                JSON Value (for .level files)
              </label>
              <div className="relative">
                <pre className="bg-muted rounded-md p-3 text-xs font-mono text-foreground overflow-x-auto">
                  {jsonSnippet}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-1 right-1"
                  onClick={() => handleCopy(jsonSnippet, "JSON")}
                >
                  {copied === "JSON" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Copy hex */}
          {isValidHex && (
            <Button
              className="w-full"
              onClick={() => handleCopy(hex, "Hex")}
            >
              {copied === "Hex" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy Hex Code
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CharacterColor;
