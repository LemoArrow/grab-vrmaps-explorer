import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PresenceContextValue {
  online: Set<string>;
  isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextValue>({
  online: new Set(),
  isOnline: () => false,
});

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setOnline(new Set());
      return;
    }
    const channel = supabase.channel("presence:global", {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnline(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <PresenceContext.Provider value={{ online, isOnline: (id) => online.has(id) }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);
