import { useState, useCallback, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shuffle, Play, SkipForward, SkipBack, Music2, Disc3 } from "lucide-react";

interface Song {
  title: string;
  artist: string;
  album: string;
  searchQuery: string;
}

const SONGS: Song[] = [
  // Blame on Me
  { title: "Blame On Me", artist: "Notti Osama ft. JJ 6ix", album: "Blame on Me", searchQuery: "Notti Osama Blame On Me JJ 6ix" },
  // Too Tact
  { title: "Too Tact", artist: "SugarHill Ddot ft. Notti Osama & DD Osama", album: "Too Tact", searchQuery: "SugarHill Ddot Notti Osama DD Osama Too Tact" },
  // La La
  { title: "La La", artist: "DD Osama & Notti Osama", album: "La La", searchQuery: "DD Osama Notti Osama La La" },
  // Macarena
  { title: "Macarena", artist: "DD Osama & Notti Osama", album: "Macarena", searchQuery: "DD Osama Notti Osama Macarena" },
  // What You Wanna Do
  { title: "What You Wanna Do", artist: "DD Osama", album: "What You Wanna Do", searchQuery: "DD Osama What You Wanna Do" },
];

const ALBUMS = ["All", "Blame on Me", "Too Tact", "La La", "Macarena", "What You Wanna Do"];

const shuffleArray = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Music = () => {
  const [queue, setQueue] = useState<Song[]>(SONGS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAlbum, setSelectedAlbum] = useState("All");
  const [isShuffled, setIsShuffled] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const filteredSongs = selectedAlbum === "All" ? SONGS : SONGS.filter(s => s.album === selectedAlbum);
  const currentSong = queue[currentIndex];

  const handleShuffle = useCallback(() => {
    const songs = selectedAlbum === "All" ? SONGS : SONGS.filter(s => s.album === selectedAlbum);
    setQueue(shuffleArray(songs));
    setCurrentIndex(0);
    setIsShuffled(true);
  }, [selectedAlbum]);

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % queue.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + queue.length) % queue.length);
  };

  const handleSelectSong = (song: Song) => {
    const idx = queue.findIndex(s => s.title === song.title);
    if (idx !== -1) {
      setCurrentIndex(idx);
    } else {
      setQueue([song, ...queue]);
      setCurrentIndex(0);
    }
  };

  const handleAlbumFilter = (album: string) => {
    setSelectedAlbum(album);
    const songs = album === "All" ? SONGS : SONGS.filter(s => s.album === album);
    setQueue(isShuffled ? shuffleArray(songs) : songs);
    setCurrentIndex(0);
  };

  // Build YouTube embed URL using search
  const embedUrl = currentSong
    ? `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(currentSong.searchQuery)}&autoplay=1`
    : "";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Music2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Music Player</h1>
        </div>
        <p className="text-muted-foreground mb-6">
          Listen to DD Osama & Notti Osama tracks. Shuffle and vibe! 🎶
        </p>

        {/* Album Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {ALBUMS.map(album => (
            <Button
              key={album}
              variant={selectedAlbum === album ? "default" : "outline"}
              size="sm"
              onClick={() => handleAlbumFilter(album)}
            >
              {album}
            </Button>
          ))}
        </div>

        {/* YouTube Player */}
        <Card className="overflow-hidden mb-6 bg-card">
          <div className="aspect-video w-full">
            {currentSong && (
              <iframe
                ref={iframeRef}
                key={currentSong.searchQuery}
                width="100%"
                height="100%"
                src={embedUrl}
                title={currentSong.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="border-0"
              />
            )}
          </div>
        </Card>

        {/* Now Playing & Controls */}
        {currentSong && (
          <Card className="p-4 mb-6 bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Disc3 className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: "3s" }} />
                <div>
                  <p className="font-bold text-foreground">{currentSong.title}</p>
                  <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
                  <p className="text-xs text-muted-foreground">Album: {currentSong.album}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePrev}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNext}>
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button
                  variant={isShuffled ? "default" : "outline"}
                  size="icon"
                  onClick={handleShuffle}
                  title="Shuffle"
                >
                  <Shuffle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Song Queue */}
        <h2 className="text-xl font-semibold mb-3 text-foreground">
          {isShuffled ? "Shuffled Queue" : "Track List"}
        </h2>
        <div className="space-y-2">
          {queue.map((song, idx) => (
            <Card
              key={`${song.title}-${idx}`}
              className={`p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                idx === currentIndex ? "border-primary bg-primary/10" : "bg-card"
              }`}
              onClick={() => setCurrentIndex(idx)}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground w-6 text-right">
                  {idx === currentIndex ? (
                    <Play className="h-4 w-4 text-primary inline" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{song.title}</p>
                  <p className="text-xs text-muted-foreground">{song.artist}</p>
                </div>
                <span className="text-xs text-muted-foreground">{song.album}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Channel Link */}
        <div className="mt-8 text-center">
          <a
            href="https://www.youtube.com/channel/UC407PKp1xBuzABEZKxLUC2A"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm"
          >
            Visit the YouTube Channel →
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default Music;
