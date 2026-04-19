import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import characterBase from "@/assets/character-base.jpeg";

const presetColors = [
  "#00C853", "#FF1744", "#FF8C00", "#FFD600", "#00BCD4",
  "#2979FF", "#7C4DFF", "#FF4081", "#FFFFFF", "#212121",
];

// Solid background presets
const solidBgPresets = [
  "#C2410C", // original orange
  "#0F172A", // dark navy
  "#1E1B4B", // indigo
  "#064E3B", // dark green
  "#7C2D12", // brown
  "#000000", // black
  "#FFFFFF", // white
  "#E11D48", // rose
];

// Gradient presets (matching the in-game card style from the upload)
const gradientBgPresets: { name: string; css: string; colors: [string, string] }[] = [
  { name: "Pink Cream", css: "linear-gradient(135deg, #FCE7F3, #FBCFE8)", colors: ["#FCE7F3", "#FBCFE8"] },
  { name: "Mint", css: "linear-gradient(135deg, #A7F3D0, #6EE7B7)", colors: ["#A7F3D0", "#6EE7B7"] },
  { name: "Sunset", css: "linear-gradient(135deg, #FDE68A, #FB7185)", colors: ["#FDE68A", "#FB7185"] },
  { name: "Sky", css: "linear-gradient(135deg, #BAE6FD, #818CF8)", colors: ["#BAE6FD", "#818CF8"] },
  { name: "Lava", css: "linear-gradient(135deg, #FCA5A5, #7F1D1D)", colors: ["#FCA5A5", "#7F1D1D"] },
  { name: "Ocean", css: "linear-gradient(135deg, #0EA5E9, #1E3A8A)", colors: ["#0EA5E9", "#1E3A8A"] },
  { name: "Aurora", css: "linear-gradient(135deg, #34D399, #8B5CF6)", colors: ["#34D399", "#8B5CF6"] },
  { name: "Night", css: "linear-gradient(135deg, #1F2937, #000000)", colors: ["#1F2937", "#000000"] },
];

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 0, g: 200, b: 83 };
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  let r: number, g: number, b: number;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

type BgMode = "solid" | "gradient";

const CharacterThumbnail = () => {
  const [color, setColor] = useState("#00C853");
  const [bgMode, setBgMode] = useState<BgMode>("gradient");
  const [bgSolid, setBgSolid] = useState("#0F172A");
  const [bgGrad, setBgGrad] = useState<[string, string]>(["#FCE7F3", "#FBCFE8"]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = characterBase;
    img.onload = () => {
      imgRef.current = img;
      render();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (imgRef.current) render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, bgMode, bgSolid, bgGrad]);

  const render = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const W = img.naturalWidth;
    const H = img.naturalHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1) Paint background first
    if (bgMode === "solid") {
      ctx.fillStyle = bgSolid;
      ctx.fillRect(0, 0, W, H);
    } else {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, bgGrad[0]);
      grad.addColorStop(1, bgGrad[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // 2) Draw character on a temp canvas so we can mask out the orange bg
    const tmp = document.createElement("canvas");
    tmp.width = W;
    tmp.height = H;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    tctx.drawImage(img, 0, 0);
    const data = tctx.getImageData(0, 0, W, H);
    const px = data.data;

    const target = hexToRgb(color);
    const targetHsl = rgbToHsl(target.r, target.g, target.b);

    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const hsl = rgbToHsl(r, g, b);

      // Background = orange/brown hue (~0.03-0.13) with decent saturation
      const isOrangeBg = hsl.h >= 0.02 && hsl.h <= 0.13 && hsl.s > 0.35 && hsl.l > 0.15 && hsl.l < 0.7;
      // Green model parts
      const isGreen = hsl.h >= 0.2 && hsl.h <= 0.45 && hsl.s > 0.18;

      if (isOrangeBg) {
        px[i + 3] = 0; // transparent — let chosen background show through
      } else if (isGreen) {
        const newRgb = hslToRgb(targetHsl.h, Math.max(targetHsl.s, 0.4), hsl.l);
        px[i] = newRgb.r;
        px[i + 1] = newRgb.g;
        px[i + 2] = newRgb.b;
      }
    }
    tctx.putImageData(data, 0, 0);

    // 3) Composite the recolored character over our background
    ctx.drawImage(tmp, 0, 0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `thumbnail_${color.replace("#", "")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Thumbnail downloaded!");
  };

  const handleHexChange = (v: string) => {
    let s = v.toUpperCase();
    if (!s.startsWith("#")) s = "#" + s;
    if (s.length <= 7) setColor(s);
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Custom Thumbnail</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6 text-center">
          Customize your character & background, then download
        </p>

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl w-full max-w-lg space-y-5">
          {/* Preview */}
          <div className="flex justify-center bg-muted rounded-md p-3">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-md"
            />
          </div>

          {/* Character color */}
          <div>
            <label className="block text-card-foreground font-medium text-sm mb-2">
              Character Color
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={color}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#00C853"
                maxLength={7}
                className="bg-input text-card-foreground border-border font-mono"
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value.toUpperCase())}
                className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className="w-7 h-7 rounded-md border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor:
                      color.toUpperCase() === c.toUpperCase()
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Background */}
          <div>
            <label className="block text-card-foreground font-medium text-sm mb-2">
              Background
            </label>
            <div className="flex gap-1 mb-3 bg-muted rounded-md p-1 w-fit">
              <button
                onClick={() => setBgMode("gradient")}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  bgMode === "gradient"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Gradient
              </button>
              <button
                onClick={() => setBgMode("solid")}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  bgMode === "solid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Solid
              </button>
            </div>

            {bgMode === "solid" ? (
              <>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={bgSolid}
                    onChange={(e) => {
                      let s = e.target.value.toUpperCase();
                      if (!s.startsWith("#")) s = "#" + s;
                      if (s.length <= 7) setBgSolid(s);
                    }}
                    placeholder="#0F172A"
                    maxLength={7}
                    className="bg-input text-card-foreground border-border font-mono"
                  />
                  <input
                    type="color"
                    value={bgSolid}
                    onChange={(e) => setBgSolid(e.target.value.toUpperCase())}
                    className="w-12 h-10 rounded cursor-pointer border border-border bg-transparent"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {solidBgPresets.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBgSolid(c)}
                      title={c}
                      className="w-7 h-7 rounded-md border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        borderColor:
                          bgSolid.toUpperCase() === c.toUpperCase()
                            ? "hsl(var(--primary))"
                            : "hsl(var(--border))",
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {gradientBgPresets.map((g) => {
                    const active =
                      bgGrad[0] === g.colors[0] && bgGrad[1] === g.colors[1];
                    return (
                      <button
                        key={g.name}
                        onClick={() => setBgGrad(g.colors)}
                        title={g.name}
                        className="h-12 rounded-md border-2 transition-transform hover:scale-105"
                        style={{
                          background: g.css,
                          borderColor: active
                            ? "hsl(var(--primary))"
                            : "hsl(var(--border))",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground">Custom:</span>
                  <input
                    type="color"
                    value={bgGrad[0]}
                    onChange={(e) =>
                      setBgGrad([e.target.value.toUpperCase(), bgGrad[1]])
                    }
                    className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent"
                  />
                  <input
                    type="color"
                    value={bgGrad[1]}
                    onChange={(e) =>
                      setBgGrad([bgGrad[0], e.target.value.toUpperCase()])
                    }
                    className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent"
                  />
                </div>
              </>
            )}
          </div>

          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download Thumbnail
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CharacterThumbnail;
