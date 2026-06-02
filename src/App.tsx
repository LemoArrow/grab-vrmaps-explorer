import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { PresenceProvider } from "@/hooks/usePresence";
import Index from "./pages/Index.tsx";
import DownloadPage from "./pages/DownloadPage.tsx";
import BrowsePage from "./pages/BrowsePage.tsx";
import Tutorial from "./pages/Tutorial.tsx";
import Legal from "./pages/Legal.tsx";
import CharacterColor from "./pages/CharacterColor.tsx";
import ModdedApk from "./pages/ModdedApk.tsx";
import CharacterCosmetics from "./pages/CharacterCosmetics.tsx";
import CharacterThumbnail from "./pages/CharacterThumbnail.tsx";
import Music from "./pages/Music.tsx";
import GameMods from "./pages/GameMods.tsx";
import UserLevels from "./pages/UserLevels.tsx";
import AILevelGenerator from "./pages/AILevelGenerator.tsx";
import Auth from "./pages/Auth.tsx";
import Social from "./pages/Social.tsx";
import Chat from "./pages/Chat.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PresenceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/tutorial" element={<Tutorial />} />
              <Route path="/character-color" element={<CharacterColor />} />
              <Route path="/character-cosmetics" element={<CharacterCosmetics />} />
              <Route path="/character-thumbnail" element={<CharacterThumbnail />} />
              <Route path="/music" element={<Music />} />
              <Route path="/game-mods" element={<GameMods />} />
              <Route path="/user-levels" element={<UserLevels />} />
              <Route path="/modded-apk" element={<ModdedApk />} />
              <Route path="/ai-generator" element={<AILevelGenerator />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/social" element={<Social />} />
              <Route path="/chat/:userId" element={<Chat />} />
              <Route path="/u/:username" element={<UserProfile />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PresenceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
