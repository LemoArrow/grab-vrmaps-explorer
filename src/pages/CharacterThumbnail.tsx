import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import characterBase from "@/assets/character-base.jpeg";

const presetColors = [
  "#00C853", // green (original)
  "#FF1744", // red
  "#FF8C00", // orange
  "#FFD600", // yellow
  "#00BCD4", // cyan
  "#2979FF", // blue
  "#7C4DFF", // purple
  "#FF4081", // pink
  "#FFFFFF", // white
  "#212121", // black
];

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 0, g: 200, b: 83 };
}

// RGB -> HSL
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

const CharacterThumbnail = () => {
  const [color, setColor] = useState("#00C853");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load the base image once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = characterBase;
    img.onload = () => {
      imgRef.current = img;
      recolor(color);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recolor whenever color changes
  useEffect(() => {
    if (imgRef.current) recolor(color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color]);

  const recolor = (hex: string) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = data.data;

    const target = hexToRgb(hex);
    const targetHsl = rgbToHsl(target.r, target.g, target.b);

    for (let i = 0; i < px.length; i += 4) {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const hsl = rgbToHsl(r, g, b);
      // Detect "green-ish" pixels of the model: hue near green (0.2-0.45), with some saturation
      const isGreen = hsl.h >= 0.2 && hsl.h <= 0.45 && hsl.s > 0.18;
      if (isGreen) {
        // Keep original lightness/saturation feel, swap hue+sat to target
        const newRgb = hslToRgb(targetHsl.h, Math.max(targetHsl.s, 0.4), hsl.l);
        px[i] = newRgb.r;
        px[i + 1] = newRgb.g;
        px[i + 2] = newRgb.b;
      }
    }
    ctx.putImageData(data, 0, 0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `character_${color.replace("#", "")}.png`;
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
          Pick a color for your character and download the thumbnail
        </p>

        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl w-full max-w-lg space-y-5">
          {/* Preview */}
          <div className="flex justify-center bg-muted rounded-md p-3">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto rounded-md"
              style={{ imageRendering: "auto" }}
            />
          </div>

          {/* Color input */}
          <div>
            <label className="block text-card-foreground font-medium text-sm mb-2">
              Character Color
            </label>
            <div className="flex gap-2">
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
          </div>

          {/* Presets */}
          <div>
            <label className="block text-card-foreground font-medium text-sm mb-2">
              Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className="w-8 h-8 rounded-md border-2 transition-transform hover:scale-110"
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
