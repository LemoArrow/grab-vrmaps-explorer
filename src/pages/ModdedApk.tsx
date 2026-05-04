import { useState } from "react";
import { Download, Shield, Edit, Shirt, Smartphone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Layout from "@/components/Layout";

const MOD_FEATURES = [
  {
    icon: Edit,
    title: "Edit Mode Anywhere",
    description: "Access the level editor from any location in-game — no restrictions.",
    color: "text-blue-400",
  },
  {
    icon: Shirt,
    title: "All Cosmetics Unlocked",
    description: "Every hat, face item, body, grapple skin, and trail is available from the start.",
    color: "text-purple-400",
  },
  {
    icon: Shield,
    title: "Anti-Ban Protection",
    description: "Built-in anti-ban system to help keep your account safe while using mods.",
    color: "text-green-400",
  },
];

const DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1McBAwu9MSQGOhNk-3pGedRHjIpFOxwQX";

const ModdedApk = () => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    toast.info("Preparing modded APK download…");

    setTimeout(() => {
      setGenerating(false);
      window.open(DRIVE_FOLDER_URL, "_blank", "noopener");
      toast.success("Opening APK folder — pick the latest version and install!");
    }, 2500);
  };

  return (
    <Layout>
      <main className="flex-1 w-full px-4 py-10 md:py-16">
        <section className="mx-auto w-full max-w-3xl space-y-10">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
              <Smartphone className="h-4 w-4" />
              Modded APK
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              GRAB VR — Modded APK Generator
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Download the modded APK with edit mode everywhere, all cosmetics unlocked, and anti-ban built in.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-3">
            {MOD_FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 space-y-2 shadow-lg"
              >
                <f.icon className={`h-8 w-8 ${f.color}`} />
                <h3 className="font-semibold text-card-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>

          {/* Generate / Download */}
          <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-8 text-center space-y-6 shadow-xl">
            <Download className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold text-card-foreground">
              Generate &amp; Download APK
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Click below to generate the latest modded APK. You'll be redirected to the download folder with the ready-to-install file.
            </p>

            <Button
              size="lg"
              className="text-lg px-8"
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Generating…
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" /> Generate Modded APK
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Or open the folder directly:{" "}
              <a
                href={DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
              >
                Google Drive <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          {/* Instructions */}
          <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6 space-y-3 shadow-lg">
            <h3 className="text-lg font-bold text-card-foreground">Installation Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Click <strong>"Generate Modded APK"</strong> above to open the download folder.</li>
              <li>Download the latest <code>.apk</code> file to your Quest or Android device.</li>
              <li>Enable <strong>"Install from unknown sources"</strong> in your device settings.</li>
              <li>Open the downloaded APK to install it.</li>
              <li>Launch the game — edit mode, cosmetics, and anti-ban are active automatically.</li>
            </ol>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default ModdedApk;
