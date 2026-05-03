import { useState } from "react";
import { Check, Copy, Coins, Shirt, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Layout from "@/components/Layout";

const GameMods = () => {
  const [coinAmount, setCoinAmount] = useState("999999");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`Copied ${label}! Drag to bookmarks bar or paste in browser URL while on grabvr.quest.`);
    setTimeout(() => setCopied(null), 2500);
  };

  // Bookmarklet: Change coins
  const coinScript = `(()=>{const amount=${coinAmount||0};const headers={'content-type':'application/json'};const token=Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>v&&v.includes('eyJ'));if(token)headers.authorization='Bearer '+token.replaceAll('"','');const body=JSON.stringify({coins:amount});Promise.any(['/api/users/me','https://api.grab.tools/users/me','https://grabvr.quest/api/users/me'].map(u=>fetch(u,{method:'PATCH',credentials:'include',headers,body}).then(r=>{if(!r.ok)throw Error(r.status);return r}))).then(()=>alert('Coins set to '+amount+'!')).catch(()=>alert('Failed. Make sure you are logged in on grabvr.quest.'));})()`;
  const coinBookmarklet = `javascript:${encodeURIComponent(coinScript)}`;

  // Bookmarklet: Unlock all cosmetics
  const unlockScript = `(()=>{const headers={'content-type':'application/json'};const token=Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>v&&v.includes('eyJ'));if(token)headers.authorization='Bearer '+token.replaceAll('"','');const cosmetics=['admin_hat','moderator_hat','moderator_hat_colors','vr_headset','black_top_hat','black_top_hat_purple','black_top_hat_red','white_top_hat_blue','crown','party_hat','santa_hat','witch_hat','halo','devil_horns','sunglasses','pink_sunglasses','monocle','clown_nose','wings','cape','jetpack','sword','shield','rainbow_trail','fire_trail','star_trail'];const slots=['head','face','back','hands','trail'];let i=0;const next=()=>{if(i>=cosmetics.length){alert('All cosmetics unlocked!');return;}const c=cosmetics[i];const slot=c.includes('trail')?'trail':c.includes('wing')||c.includes('cape')||c.includes('jetpack')?'back':c.includes('sword')||c.includes('shield')?'hands':c.includes('glass')||c.includes('monocle')||c.includes('nose')?'face':'head';const body=JSON.stringify({slot,cosmeticId:c,equipped:true});Promise.any(['/api/users/me/cosmetics','https://api.grab.tools/users/me/cosmetics','https://grabvr.quest/api/users/me/cosmetics'].map(u=>fetch(u,{method:'PATCH',credentials:'include',headers,body}).then(r=>{if(!r.ok)throw Error(r.status);return r}))).finally(()=>{i++;setTimeout(next,200);});};next();})()`;
  const unlockBookmarklet = `javascript:${encodeURIComponent(unlockScript)}`;

  return (
    <Layout>
      <main className="flex-1 w-full px-4 py-10 md:py-16">
        <section className="mx-auto w-full max-w-3xl space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bookmark className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Game Mods</h1>
            </div>
            <p className="text-muted-foreground">
              Save these bookmarklets to your browser's bookmarks bar, then click them while logged in on grabvr.quest to activate.
            </p>
          </div>

          {/* Coin Changer */}
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-yellow-500" />
              <div>
                <h2 className="text-xl font-bold text-card-foreground">Coin Changer</h2>
                <p className="text-sm text-muted-foreground">Set your in-game coins to any amount</p>
              </div>
            </div>

            <div className="flex gap-2 max-w-sm">
              <Input
                type="number"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
                placeholder="999999"
                className="bg-input text-card-foreground border-border font-mono"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {["1000", "10000", "100000", "999999", "9999999"].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCoinAmount(amt)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
                    coinAmount === amt
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {Number(amt).toLocaleString()}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                className="border-yellow-500/50 hover:bg-yellow-500/10"
              >
                <a
                  href={coinBookmarklet}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCopy(coinBookmarklet, "Coin bookmarklet");
                  }}
                >
                  <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                  💰 Set Coins
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(coinBookmarklet, "Coin bookmarklet")}
              >
                {copied === "Coin bookmarklet" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Drag the button above to your bookmarks bar, or click to copy. Then visit grabvr.quest, log in, and click the bookmark.
            </p>
          </div>

          {/* Unlock All Cosmetics */}
          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Shirt className="h-8 w-8 text-purple-500" />
              <div>
                <h2 className="text-xl font-bold text-card-foreground">Unlock All Cosmetics</h2>
                <p className="text-sm text-muted-foreground">Enable every cosmetic item on your account</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-500/10"
              >
                <a
                  href={unlockBookmarklet}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCopy(unlockBookmarklet, "Unlock bookmarklet");
                  }}
                >
                  <Shirt className="h-4 w-4 mr-1 text-purple-500" />
                  🔓 Unlock All
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(unlockBookmarklet, "Unlock bookmarklet")}
              >
                {copied === "Unlock bookmarklet" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              This will attempt to equip all known cosmetics to your account one by one. Make sure you're logged in on grabvr.quest first.
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default GameMods;
