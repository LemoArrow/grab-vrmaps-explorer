import { useMemo, useState } from "react";
import { Check, Copy, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";

type CosmeticCategory = "Cosmetics" | "Main Color" | "Detail Color" | "All";

interface CosmeticItem {
  name: string;
  id: string;
  category: "cosmetic" | "main_color" | "detail_color";
  slot: string;
  emoji?: string;
}

const allCosmetics: CosmeticItem[] = [
  // Hats
  { name: "Admin Hat", id: "admin_hat", category: "cosmetic", slot: "head", emoji: "🎩" },
  { name: "Moderator Hat", id: "moderator_hat", category: "cosmetic", slot: "head", emoji: "👒" },
  { name: "Moderator Hat Colors", id: "moderator_hat_colors", category: "cosmetic", slot: "head", emoji: "🎨" },
  { name: "VR Headset", id: "vr_headset", category: "cosmetic", slot: "head", emoji: "🥽" },
  { name: "Black Top Hat", id: "black_top_hat", category: "cosmetic", slot: "head", emoji: "🎩" },
  { name: "Black Top Hat With Purple", id: "black_top_hat_purple", category: "cosmetic", slot: "head", emoji: "🎩" },
  { name: "Black Top Hat With Red", id: "black_top_hat_red", category: "cosmetic", slot: "head", emoji: "🎩" },
  { name: "White Top Hat With Blue", id: "white_top_hat_blue", category: "cosmetic", slot: "head", emoji: "🎩" },
  { name: "Crown", id: "crown", category: "cosmetic", slot: "head", emoji: "👑" },
  { name: "Party Hat", id: "party_hat", category: "cosmetic", slot: "head", emoji: "🎉" },
  { name: "Santa Hat", id: "santa_hat", category: "cosmetic", slot: "head", emoji: "🎅" },
  { name: "Witch Hat", id: "witch_hat", category: "cosmetic", slot: "head", emoji: "🧙" },
  { name: "Halo", id: "halo", category: "cosmetic", slot: "head", emoji: "😇" },
  { name: "Devil Horns", id: "devil_horns", category: "cosmetic", slot: "head", emoji: "😈" },
  // Face
  { name: "Sunglasses", id: "sunglasses", category: "cosmetic", slot: "face", emoji: "😎" },
  { name: "Pink Sunglasses", id: "pink_sunglasses", category: "cosmetic", slot: "face", emoji: "🕶️" },
  { name: "Monocle", id: "monocle", category: "cosmetic", slot: "face", emoji: "🧐" },
  { name: "Clown Nose", id: "clown_nose", category: "cosmetic", slot: "face", emoji: "🤡" },
  // Body
  { name: "Wings", id: "wings", category: "cosmetic", slot: "back", emoji: "🪽" },
  { name: "Cape", id: "cape", category: "cosmetic", slot: "back", emoji: "🦸" },
  { name: "Jetpack", id: "jetpack", category: "cosmetic", slot: "back", emoji: "🚀" },
  // Hands
  { name: "Sword", id: "sword", category: "cosmetic", slot: "hands", emoji: "⚔️" },
  { name: "Shield", id: "shield", category: "cosmetic", slot: "hands", emoji: "🛡️" },
  // Trail
  { name: "Rainbow Trail", id: "rainbow_trail", category: "cosmetic", slot: "trail", emoji: "🌈" },
  { name: "Fire Trail", id: "fire_trail", category: "cosmetic", slot: "trail", emoji: "🔥" },
  { name: "Star Trail", id: "star_trail", category: "cosmetic", slot: "trail", emoji: "⭐" },
  // Main Colors
  { name: "Red", id: "red", category: "main_color", slot: "body", emoji: "🔴" },
  { name: "Blue", id: "blue", category: "main_color", slot: "body", emoji: "🔵" },
  { name: "Green", id: "green", category: "main_color", slot: "body", emoji: "🟢" },
  { name: "Yellow", id: "yellow", category: "main_color", slot: "body", emoji: "🟡" },
  { name: "Purple", id: "purple", category: "main_color", slot: "body", emoji: "🟣" },
  { name: "Orange", id: "orange", category: "main_color", slot: "body", emoji: "🟠" },
  { name: "Black", id: "black", category: "main_color", slot: "body", emoji: "⚫" },
  { name: "White", id: "white", category: "main_color", slot: "body", emoji: "⚪" },
  { name: "Pink", id: "pink", category: "main_color", slot: "body", emoji: "🩷" },
  // Detail Colors
  { name: "Gold Detail", id: "gold_detail", category: "detail_color", slot: "body", emoji: "✨" },
  { name: "Silver Detail", id: "silver_detail", category: "detail_color", slot: "body", emoji: "🪩" },
  { name: "Red Detail", id: "red_detail", category: "detail_color", slot: "body", emoji: "❤️" },
  { name: "Blue Detail", id: "blue_detail", category: "detail_color", slot: "body", emoji: "💙" },
  { name: "Green Detail", id: "green_detail", category: "detail_color", slot: "body", emoji: "💚" },
  { name: "Purple Detail", id: "purple_detail", category: "detail_color", slot: "body", emoji: "💜" },
];

const tabs: CosmeticCategory[] = ["Cosmetics", "Main Color", "Detail Color", "All"];

const CharacterCosmetics = () => {
  const [activeTab, setActiveTab] = useState<CosmeticCategory>("Cosmetics");
  const [customId, setCustomId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (activeTab === "All") return allCosmetics;
    if (activeTab === "Cosmetics") return allCosmetics.filter((c) => c.category === "cosmetic");
    if (activeTab === "Main Color") return allCosmetics.filter((c) => c.category === "main_color");
    return allCosmetics.filter((c) => c.category === "detail_color");
  }, [activeTab]);

  const makeBookmarklet = (cosmeticId: string, slot: string) => {
    const script = `(()=>{const cosmeticId=${JSON.stringify(cosmeticId)};const slot=${JSON.stringify(slot)};if(!cosmeticId)return;const body=JSON.stringify({slot,cosmeticId,equipped:true});const headers={'content-type':'application/json'};const token=Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>v&&v.includes('eyJ'));if(token)headers.authorization='Bearer '+token.replaceAll('"','');Promise.any(['/api/users/me/cosmetics','https://api.grab.tools/users/me/cosmetics','https://grabvr.quest/api/users/me/cosmetics'].map(u=>fetch(u,{method:'PATCH',credentials:'include',headers,body}).then(r=>{if(!r.ok)throw Error(r.status);return r}))).then(()=>alert('Equipped '+cosmeticId+' in '+slot)).catch(()=>alert('Could not equip. Make sure you are logged in on grabvr.quest.'));})()`;
    return `javascript:${encodeURIComponent(script)}`;
  };

  const handleEquip = (item: CosmeticItem) => {
    const bm = makeBookmarklet(item.id, item.slot);
    navigator.clipboard.writeText(bm);
    setCopied(item.id);
    toast.success(`Copied "${item.name}" bookmarklet! Paste it in your browser while on grabvr.quest.`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCustomEquip = () => {
    if (!customId.trim()) {
      toast.error("Enter a cosmetic ID first.");
      return;
    }
    const bm = makeBookmarklet(customId.trim(), "head");
    navigator.clipboard.writeText(bm);
    setCopied("custom");
    toast.success("Copied custom bookmarklet!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout>
      <main className="flex-1 w-full px-4 py-10 md:py-16">
        <section className="mx-auto w-full max-w-5xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shirt className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Cosmetics</h1>
            </div>
            <p className="text-muted-foreground">
              Click "Preview" to copy a bookmarklet that equips the cosmetic. Run it in your browser while logged in on grabvr.quest.
            </p>
          </div>

          {/* Custom ID */}
          <div className="flex gap-2 max-w-md">
            <Input
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="Custom cosmetic ID..."
              className="bg-input text-card-foreground border-border font-mono"
            />
            <Button onClick={handleCustomEquip} variant="outline">
              {copied === "custom" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              Equip
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-4xl">{item.emoji || "🎭"}</span>
                <p className="text-sm font-medium text-card-foreground text-center leading-tight min-h-[2.5rem] flex items-center">
                  {item.name}
                </p>
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleEquip(item)}
                >
                  {copied === item.id ? <Check className="h-3 w-3 mr-1" /> : null}
                  Preview
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default CharacterCosmetics;
