import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";

const cosmeticSlots = ["Head", "Face", "Body", "Back", "Hands", "Trail"];

const popularCosmetics = [
  { name: "Custom ID", id: "" },
  { name: "VR Headset", id: "vr_headset" },
  { name: "GAB Checkpoint", id: "gab_checkpoint" },
  { name: "Crown", id: "crown" },
  { name: "Top Hat", id: "top_hat" },
  { name: "Wings", id: "wings" },
];

const CharacterCosmetics = () => {
  const [cosmeticId, setCosmeticId] = useState("vr_headset");
  const [slot, setSlot] = useState("Head");
  const [copied, setCopied] = useState<string | null>(null);

  const cleanCosmeticId = cosmeticId.trim();

  const payload = useMemo(
    () => ({
      slot: slot.toLowerCase(),
      cosmeticId: cleanCosmeticId,
      equipped: true,
    }),
    [cleanCosmeticId, slot]
  );

  const bookmarklet = useMemo(() => {
    const script = `(()=>{const cosmeticId=${JSON.stringify(cleanCosmeticId)}||prompt('Cosmetic ID');const slot=${JSON.stringify(slot.toLowerCase())};if(!cosmeticId)return;const body=JSON.stringify({slot,cosmeticId,equipped:true});const headers={'content-type':'application/json'};const token=Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>v&&v.includes('eyJ'));if(token)headers.authorization='Bearer '+token.replaceAll('"','');Promise.any(['/api/users/me/cosmetics','https://api.grab.tools/users/me/cosmetics','https://grabvr.quest/api/users/me/cosmetics'].map(u=>fetch(u,{method:'PATCH',credentials:'include',headers,body}).then(r=>{if(!r.ok)throw Error(r.status);return r}))).then(()=>alert('Equipped '+cosmeticId+' in '+slot)).catch(()=>alert('Could not equip automatically. Make sure you are logged in on grabvr.quest, then try again.'));})()`;
    return `javascript:${encodeURIComponent(script)}`;
  }, [cleanCosmeticId, slot]);

  const jsonSnippet = JSON.stringify(payload, null, 2);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Copied ${label}!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout>
      <main className="flex-1 w-full px-4 py-10 md:py-16">
        <section className="mx-auto w-full max-w-3xl space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shirt className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Custom Cosmetics</h1>
            </div>
            <p className="max-w-2xl text-muted-foreground">
              Pick a slot and cosmetic ID, then drag the button to your bookmarks bar or click it to copy. Run it while logged in on the GRAB level browser.
            </p>
            <Button
              asChild
              variant="outline"
              disabled={!cleanCosmeticId}
              className="h-10 border-border bg-card/70 px-5 text-card-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <a
                href={bookmarklet}
                onClick={(e) => {
                  e.preventDefault();
                  if (!cleanCosmeticId) {
                    toast.error("Enter a cosmetic ID first.");
                    return;
                  }
                  handleCopy(bookmarklet, "Bookmarklet");
                }}
              >
                Equip Cosmetic
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg p-6 shadow-xl w-full max-w-lg space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-card-foreground font-medium text-sm">Cosmetic Slot</label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {cosmeticSlots.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-card-foreground font-medium text-sm">Quick Pick</label>
                <select
                  value={popularCosmetics.find((item) => item.id === cosmeticId)?.id ?? ""}
                  onChange={(e) => setCosmeticId(e.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {popularCosmetics.map((item) => (
                    <option key={item.name} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-card-foreground font-medium text-sm">Cosmetic ID</label>
              <Input
                value={cosmeticId}
                onChange={(e) => setCosmeticId(e.target.value)}
                placeholder="example_cosmetic_id"
                className="bg-input text-card-foreground border-border font-mono"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Selected</p>
                  <p className="text-xs text-muted-foreground">{slot} · {cleanCosmeticId || "No cosmetic ID"}</p>
                </div>
                <Shirt className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div>
              <label className="block text-card-foreground font-medium text-sm mb-2">Equip Payload</label>
              <div className="relative">
                <pre className="bg-muted rounded-md p-3 text-xs font-mono text-foreground overflow-x-auto">{jsonSnippet}</pre>
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

            <Button className="w-full" disabled={!cleanCosmeticId} onClick={() => handleCopy(bookmarklet, "Bookmarklet")}>
              {copied === "Bookmarklet" ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              Copy Equip Bookmarklet
            </Button>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default CharacterCosmetics;