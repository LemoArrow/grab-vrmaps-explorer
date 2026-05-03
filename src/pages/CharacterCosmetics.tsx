import { useMemo, useState } from "react";
import { Check, Copy, Shirt, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";

type CosmeticCategory = "All" | "Hats" | "Heads" | "Face" | "Bodies" | "Backpack" | "Neck" | "Waist" | "Hands" | "Grapple" | "Checkpoint" | "Badges";

interface CosmeticItem {
  name: string;
  id: string;
  category: CosmeticCategory;
  /** Path used for the thumbnail image: cosmetics/{path}.png */
  path: string;
}

// Badge items (dev, mod, etc.)
interface BadgeItem {
  name: string;
  id: string;
  emoji: string;
}

const badges: BadgeItem[] = [
  { name: "Developer", id: "developer", emoji: "🛠️" },
  { name: "Moderator", id: "moderator", emoji: "🛡️" },
  { name: "Admin", id: "admin", emoji: "👑" },
  { name: "Content Creator", id: "content_creator", emoji: "🎥" },
  { name: "CC Architect", id: "cc_architect", emoji: "🏗️" },
  { name: "CC Builder", id: "cc_builder", emoji: "🔨" },
  { name: "Discord", id: "discord", emoji: "💬" },
  { name: "Tester", id: "tester", emoji: "🧪" },
  { name: "Translator", id: "translator", emoji: "🌐" },
  { name: "Bug Hunter", id: "bug_hunter", emoji: "🐛" },
  { name: "Verified", id: "verified", emoji: "✅" },
  { name: "Early Supporter", id: "early_supporter", emoji: "⭐" },
];

function formatName(id: string): string {
  return id
    .replace(/^\d{4}_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseCosmetics(): CosmeticItem[] {
  const raw = [
    // Hats
    "head/hat/2025_summer", "head/hat/2025_sounds_drum", "head/hat/2025_robot",
    "head/hat/2025_adam_brain", "head/hat/2025_adam_hair", "head/hat/2025_adam_combined",
    "head/hat/2025_november_hair", "head/hat/2025_november_bow", "head/hat/2025_november_hair_bow",
    "head/hat/2025_christmas_hat", "head/hat/2025_christmas_reindeer",
    "head/hat/2026_january", "head/hat/2026_february",
    "head/hat/2024_daily_octopus", "head/hat/2024_daily_bucket_real",
    "head/hat/2024_daily_trafficcone", "head/hat/2024_daily_chef",
    "head/hat/2024_daily_dino", "head/hat/2024_daily_headset",
    "head/hat/2024_daily_tophats", "head/hat/2024_daily_scientisthair",
    "head/hat/2024_daily_bearskin", "head/hat/2024_daily_beanie",
    "head/hat/2024_daily_flowerring", "head/hat/2025_cloud",
    "head/hat/2025_bug", "head/hat/2025_fez",
    "head/hat/2026_march_mohawk", "head/hat/2026_april_smallmushrooms",
    "head/hat/2026_april_bigmushroom",
    // Heads
    "head/head/2025_robot", "head/head/2025_camera", "head/head/2025_zombie",
    "head/head/2025_adam", "head/head/2025_november_lantern",
    "head/head/2025_november_cheeks", "head/head/2025_christmas_elf",
    "head/head/2025_christmas_reindeer", "head/head/2026_january",
    "head/head/2024_daily_monkey", "head/head/2024_daily_knight",
    "head/head/2024_daily_damaged", "head/head/2024_daily_broken",
    "head/head/2025_daily_rabbit", "head/head/2026_march_runner",
    // Face / Glasses
    "head/glasses/2025_summer_smirk", "head/glasses/2025_summer_sporty",
    "head/glasses/2025_summer_elegant", "head/glasses/2025_zombie",
    "head/glasses/2025_november_eyelashes", "head/glasses/2025_christmas_stars",
    "head/glasses/2024_daily_mustache_2", "head/glasses/2024_daily_mustache_1",
    "head/glasses/2024_daily_skigoggles", "head/glasses/2024_daily_sunglasses",
    "head/glasses/2024_daily_plague", "head/glasses/2024_daily_gasmask",
    "head/glasses/2026_march_mask_bear", "head/glasses/2026_march_mask_hare",
    "head/glasses/2026_march_mask_fox",
    // Bodies
    "body/body/2025_builder", "body/body/2025_salesman", "body/body/2025_shopper",
    "body/body/2025_robot", "body/body/2025_zombie", "body/body/2025_adam",
    "body/body/2025_november_suit", "body/body/2025_november_elegant",
    "body/body/2025_christmas_elf", "body/body/2025_christmas_reindeer",
    "body/body/2026_january", "body/body/2026_february",
    "body/body/2024_daily_monkey", "body/body/2024_daily_damaged",
    "body/body/2024_daily_broken", "body/body/2025_daily_rabbit",
    "body/body/2026_march_runner", "body/body/2026_march_hoodie_1",
    "body/body/2026_march_hoodie_2", "body/body/2026_april_mushrooms",
    // Backpack
    "body/backpack/2025_easter_eggpack", "body/backpack/2025_sounds",
    "body/backpack/2025_film_roll", "body/backpack/2024_daily_travel",
    "body/backpack/2024_daily_jetpack", "body/backpack/2024_daily_solar",
    "body/backpack/2024_daily_guitar", "body/backpack/2024_daily_wings",
    "body/backpack/2026_february_backpack", "body/backpack/2026_february_wings",
    "body/backpack/2026_march_messengerbag", "body/backpack/2026_april_mushrooms",
    // Neck
    "body/neck/2025_shopper_goldchain", "body/neck/2025_november_pearl_necklace",
    "body/neck/2025_christmas_reindeer", "body/neck/2026_january_scarf",
    "body/neck/2026_february_heart", "body/neck/2024_daily_tie",
    "body/neck/2024_daily_gold_chain", "body/neck/2024_daily_scarf",
    // Lower / Waist
    "body/lower/2025_summer", "body/lower/2025_sounds_bongos",
    // Hands
    "hand/2025_robot", "hand/2025_christmas", "hand/2026_january_glove",
    "hand/2024_daily_monkey", "hand/2024_daily_crab", "hand/2024_daily_cat",
    "hand/special_burger",
    // Grapple hooks
    "grapple/hook/2025_builder_wrench", "grapple/hook/2025_summer",
    "grapple/hook/2025_easter_carrot", "grapple/hook/2025_salesman",
    "grapple/hook/2025_shopper", "grapple/hook/2025_robot",
    "grapple/hook/2025_film_slate", "grapple/hook/2025_november_walkingstick",
    "grapple/hook/2025_christmas_pinecone", "grapple/hook/2024_daily_pirate",
    "grapple/hook/2024_daily_drill_mk2", "grapple/hook/2026_february_butterfly",
    // Checkpoints
    "checkpoint/2025_easter_eggbasket", "checkpoint/2025_cashregister",
    "checkpoint/2025_sounds_microphone", "checkpoint/2025_film_kong",
    "checkpoint/2025_film_light", "checkpoint/2025_shopper_helper",
    "checkpoint/2025_november_bonfire", "checkpoint/2025_christmas_present",
    "checkpoint/2025_christmas_cookietable", "checkpoint/2026_january_snowball_pile",
    "checkpoint/2026_february_heart_flag", "checkpoint/2026_march_mailbox",
    "checkpoint/2026_april_well",
    "checkpoint/2024_daily_flower", "checkpoint/2024_daily_ducky",
    "checkpoint/2024_daily_moai", "checkpoint/2024_daily_portal",
    "checkpoint/2024_daily_toilet", "checkpoint/2024_daily_nuclearwaste",
    "checkpoint/2025_daily_builder_workbench", "checkpoint/2025_summer_drink",
    // Badges
    "body/badge/2025_salesman", "body/badge/pin_pride_2025",
    "body/badge/2024_content_creator", "body/badge/2025_cc_architect",
    "body/badge/2026_cc_builder", "body/badge/2024_discord", "body/badge/2026_gab_6",
    "body/badge/2026_february_rose",
  ];

  const categoryMap: Record<string, CosmeticCategory> = {
    "head/hat": "Hats",
    "head/head": "Heads",
    "head/glasses": "Face",
    "body/body": "Bodies",
    "body/backpack": "Backpack",
    "body/neck": "Neck",
    "body/lower": "Waist",
    "body/badge": "Badges",
    hand: "Hands",
    "grapple/hook": "Grapple",
    checkpoint: "Checkpoint",
  };

  return raw.map((path) => {
    const parts = path.split("/");
    const id = parts[parts.length - 1];
    let catKey: string;
    if (parts.length === 3) catKey = `${parts[0]}/${parts[1]}`;
    else catKey = parts[0];

    return {
      name: formatName(id),
      id,
      category: categoryMap[catKey] || "All",
      path,
    };
  });
}

const allCosmetics = parseCosmetics();
const categories: CosmeticCategory[] = [
  "All", "Hats", "Heads", "Face", "Bodies", "Backpack", "Neck", "Waist", "Hands", "Grapple", "Checkpoint", "Badges",
];

const CharacterCosmetics = () => {
  const [activeTab, setActiveTab] = useState<CosmeticCategory>("All");
  const [showBadges, setShowBadges] = useState(false);
  const [customId, setCustomId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    if (activeTab === "All") return allCosmetics;
    return allCosmetics.filter((c) => c.category === activeTab);
  }, [activeTab]);

  const makeEquipBookmarklet = (cosmeticId: string, slot: string) => {
    const script = `(()=>{const cosmeticId=${JSON.stringify(cosmeticId)};const slot=${JSON.stringify(slot)};if(!cosmeticId)return;const body=JSON.stringify({slot,cosmeticId,equipped:true});const headers={'content-type':'application/json'};const token=Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>v&&v.includes('eyJ'));if(token)headers.authorization='Bearer '+token.replaceAll('"','');Promise.any(['/api/users/me/cosmetics','https://api.grab.tools/users/me/cosmetics','https://grabvr.quest/api/users/me/cosmetics'].map(u=>fetch(u,{method:'PATCH',credentials:'include',headers,body}).then(r=>{if(!r.ok)throw Error(r.status);return r}))).then(()=>alert('Equipped '+cosmeticId+' in '+slot)).catch(()=>alert('Could not equip. Make sure you are logged in on grabvr.quest.'));})()`;
    return `javascript:${encodeURIComponent(script)}`;
  };

  const makeBadgeBookmarklet = (badgeId: string) => {
    const script = `(()=>{const badge=${JSON.stringify(badgeId)};const headers={'content-type':'application/json'};const token=Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>v&&v.includes('eyJ'));if(token)headers.authorization='Bearer '+token.replaceAll('"','');const body=JSON.stringify({badge});Promise.any(['/api/users/me','https://api.grab.tools/users/me','https://grabvr.quest/api/users/me'].map(u=>fetch(u,{method:'PATCH',credentials:'include',headers,body}).then(r=>{if(!r.ok)throw Error(r.status);return r}))).then(()=>alert('Badge set to '+badge+'!')).catch(()=>alert('Could not set badge. Make sure you are logged in.'));})()`;
    return `javascript:${encodeURIComponent(script)}`;
  };

  const slotFromCategory = (cat: CosmeticCategory): string => {
    const map: Record<string, string> = {
      Hats: "head", Heads: "head", Face: "face", Bodies: "body",
      Backpack: "back", Neck: "neck", Waist: "waist", Hands: "hands",
      Grapple: "grapple", Checkpoint: "checkpoint", Badges: "badge",
    };
    return map[cat] || "head";
  };

  const handleEquip = (item: CosmeticItem) => {
    const bm = makeEquipBookmarklet(item.id, slotFromCategory(item.category));
    navigator.clipboard.writeText(bm);
    setCopied(item.id);
    toast.success(`Copied "${item.name}" bookmarklet!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleBadgeEquip = (badge: BadgeItem) => {
    const bm = makeBadgeBookmarklet(badge.id);
    navigator.clipboard.writeText(bm);
    setCopied(`badge-${badge.id}`);
    toast.success(`Copied "${badge.name}" badge bookmarklet!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCustomEquip = () => {
    if (!customId.trim()) { toast.error("Enter a cosmetic ID first."); return; }
    const bm = makeEquipBookmarklet(customId.trim(), "head");
    navigator.clipboard.writeText(bm);
    setCopied("custom");
    toast.success("Copied custom bookmarklet!");
    setTimeout(() => setCopied(null), 2000);
  };

  const thumbnailUrl = (path: string) =>
    `https://grabvr.quest/cosmetics/${path}.png`;

  return (
    <Layout>
      <main className="flex-1 w-full px-4 py-10 md:py-16">
        <section className="mx-auto w-full max-w-6xl space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shirt className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Cosmetics</h1>
            </div>
            <p className="text-muted-foreground">
              Click "Preview" to copy a bookmarklet that equips the cosmetic. Run it in your browser while logged in on grabvr.quest.
            </p>
          </div>

          {/* Custom ID + Badge toggle */}
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              placeholder="Custom cosmetic ID..."
              className="bg-input text-card-foreground border-border font-mono max-w-xs"
            />
            <Button onClick={handleCustomEquip} variant="outline" size="sm">
              {copied === "custom" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              Equip
            </Button>
            <Button
              onClick={() => setShowBadges(!showBadges)}
              variant={showBadges ? "default" : "outline"}
              size="sm"
            >
              <Shield className="h-4 w-4 mr-1" />
              Badges
            </Button>
          </div>

          {/* Badge selector */}
          {showBadges && (
            <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-5 shadow-xl space-y-3">
              <h2 className="text-lg font-bold text-card-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Change Badge
              </h2>
              <p className="text-sm text-muted-foreground">
                Click to copy a bookmarklet that sets your badge to Dev, Mod, etc.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badges.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleBadgeEquip(b)}
                    className="flex items-center gap-2 bg-muted hover:bg-accent rounded-lg p-3 transition-colors text-left"
                  >
                    <span className="text-2xl">{b.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{b.id}</p>
                    </div>
                    {copied === `badge-${b.id}` && <Check className="h-4 w-4 text-green-500 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category tabs */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((tab) => (
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

          {/* Cosmetics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.path}
                className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
              >
                {!imgErrors.has(item.path) ? (
                  <img
                    src={thumbnailUrl(item.path)}
                    alt={item.name}
                    className="w-16 h-16 object-contain"
                    loading="lazy"
                    onError={() => setImgErrors((prev) => new Set(prev).add(item.path))}
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center text-3xl bg-muted rounded-lg">
                    🎭
                  </div>
                )}
                <p className="text-xs font-medium text-card-foreground text-center leading-tight min-h-[2rem] flex items-center">
                  {item.name}
                </p>
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-xs"
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
