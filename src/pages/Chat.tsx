import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Phone, PhoneOff, Send, Mic, MicOff, MoreVertical,
  User as UserIcon, Ban, UserMinus, Video, Smile, Image as ImageIcon, ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

const ICE: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Chat = () => {
  const { userId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = usePresence();

  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockingMe, setBlockingMe] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Call state
  const [callState, setCallState] = useState<"idle" | "calling" | "incoming" | "active">("idle");
  const [muted, setMuted] = useState(false);
  const [callStart, setCallStart] = useState<number | null>(null);
  const [callElapsed, setCallElapsed] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const signalChRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  const callChannelName = user && userId ? `call-${[user.id, userId].sort().join("-")}` : "";
  const otherOnline = userId ? isOnline(userId) : false;

  const loadMessages = useCallback(async () => {
    if (!user || !userId) return;
    const { data } = await supabase
      .from("messages").select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
  }, [user, userId]);

  const loadBlocks = useCallback(async () => {
    if (!user || !userId) return;
    const [{ data: a }, { data: b }] = await Promise.all([
      supabase.from("blocks").select("id").eq("blocker_id", user.id).eq("blocked_id", userId).maybeSingle(),
      supabase.from("blocks").select("id").eq("blocker_id", userId).eq("blocked_id", user.id).maybeSingle(),
    ]);
    setBlockedByMe(!!a);
    setBlockingMe(!!b);
  }, [user, userId]);

  useEffect(() => {
    if (!user || !userId) return;
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle()
      .then(({ data }) => setOther(data));
    loadMessages();
    loadBlocks();
    const ch = supabase
      .channel(`msg-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message;
        if ((m.sender_id === userId && m.receiver_id === user.id) || (m.sender_id === user.id && m.receiver_id === userId)) {
          setMessages((prev) => [...prev, m]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, userId, loadMessages, loadBlocks]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Call timer
  useEffect(() => {
    if (callState !== "active" || !callStart) return;
    const t = setInterval(() => setCallElapsed(Math.floor((Date.now() - callStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [callState, callStart]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user || !userId) return;
    if (blockedByMe || blockingMe) { toast.error("You can't message this user"); return; }
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id, receiver_id: userId, content: content.trim(),
    });
    if (error) toast.error(error.message);
  };

  const send = async () => {
    const c = text.trim(); setText("");
    await sendMessage(c);
  };

  // ---------- WebRTC ----------
  const cleanupCall = useCallback(() => {
    pcRef.current?.close(); pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    incomingOfferRef.current = null;
    setCallState("idle"); setMuted(false);
    setCallStart(null); setCallElapsed(0);
  }, []);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection(ICE);
    pc.onicecandidate = (e) => {
      if (e.candidate && signalChRef.current) {
        signalChRef.current.send({ type: "broadcast", event: "ice", payload: { from: user!.id, candidate: e.candidate } });
      }
    };
    pc.ontrack = (e) => {
      const el = remoteAudioRef.current;
      if (el) {
        if (el.srcObject !== e.streams[0]) el.srcObject = e.streams[0];
        el.muted = false; el.volume = 1;
        el.play().catch(() => {
          toast("Tap anywhere to enable call audio");
          const resume = () => { el.play().catch(() => {}); document.removeEventListener("click", resume); };
          document.addEventListener("click", resume, { once: true });
        });
      }
    };
    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) cleanupCall();
    };
    try { pc.addTransceiver("audio", { direction: "sendrecv" }); } catch {}
    pcRef.current = pc;
    return pc;
  }, [user, cleanupCall]);

  useEffect(() => {
    if (!user || !userId || !callChannelName) return;
    const ch = supabase.channel(callChannelName, { config: { broadcast: { self: false }, private: true } });
    ch.on("broadcast", { event: "offer" }, async ({ payload }) => {
      if (payload.from === user.id) return;
      incomingOfferRef.current = payload.sdp;
      setCallState("incoming");
    });
    ch.on("broadcast", { event: "answer" }, async ({ payload }) => {
      if (payload.from === user.id) return;
      if (pcRef.current && !pcRef.current.currentRemoteDescription) {
        await pcRef.current.setRemoteDescription(payload.sdp);
        setCallState("active"); setCallStart(Date.now());
      }
    });
    ch.on("broadcast", { event: "ice" }, async ({ payload }) => {
      if (payload.from === user.id) return;
      try { await pcRef.current?.addIceCandidate(payload.candidate); } catch {}
    });
    ch.on("broadcast", { event: "hangup" }, () => { cleanupCall(); toast("Call ended"); });
    ch.subscribe();
    signalChRef.current = ch;
    return () => { supabase.removeChannel(ch); signalChRef.current = null; };
  }, [user, userId, callChannelName, cleanupCall]);

  const startCall = async () => {
    if (blockedByMe || blockingMe) { toast.error("You can't call this user"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalChRef.current?.send({ type: "broadcast", event: "offer", payload: { from: user!.id, sdp: offer } });
      setCallState("calling");
    } catch {
      toast.error("Mic access denied"); cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingOfferRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(incomingOfferRef.current);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signalChRef.current?.send({ type: "broadcast", event: "answer", payload: { from: user!.id, sdp: answer } });
      setCallState("active"); setCallStart(Date.now());
    } catch { toast.error("Mic access denied"); cleanupCall(); }
  };

  const hangup = () => {
    signalChRef.current?.send({ type: "broadcast", event: "hangup", payload: { from: user!.id } });
    cleanupCall();
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); }
  };

  // ---------- Block / unfriend ----------
  const blockUser = async () => {
    if (!user || !userId) return;
    await supabase.from("friendships").delete()
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`);
    const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: userId });
    if (error) toast.error(error.message);
    else { toast.success("User blocked"); loadBlocks(); }
  };
  const unblockUser = async () => {
    await supabase.from("blocks").delete().eq("blocker_id", user!.id).eq("blocked_id", userId!);
    toast.success("Unblocked"); loadBlocks();
  };
  const unfriend = async () => {
    await supabase.from("friendships").delete()
      .or(`and(requester_id.eq.${user!.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user!.id})`);
    toast.success("Removed friend");
  };

  if (loading || !user) return null;

  const elapsedStr = `${String(Math.floor(callElapsed / 60)).padStart(2, "0")}:${String(callElapsed % 60).padStart(2, "0")}`;

  // Group messages by sender for Messenger-style stacking
  const grouped: { sender_id: string; items: Message[] }[] = [];
  messages.forEach((m) => {
    const last = grouped[grouped.length - 1];
    if (last && last.sender_id === m.sender_id) last.items.push(m);
    else grouped.push({ sender_id: m.sender_id, items: [m] });
  });

  return (
    <Layout>
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Fullscreen call overlay (Messenger-style) */}
      {(callState === "calling" || callState === "incoming" || callState === "active") && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0084ff] via-[#0064d8] to-[#44329b] flex flex-col items-center justify-between py-12 px-6 text-white">
          <div className="text-center">
            <p className="text-sm opacity-80 uppercase tracking-wider">
              {callState === "calling" && "Calling..."}
              {callState === "incoming" && "Incoming call"}
              {callState === "active" && "On call"}
            </p>
            <h2 className="text-3xl font-semibold mt-2">{other?.display_name || other?.username}</h2>
            <p className="opacity-80 text-sm mt-1">
              {callState === "active" ? elapsedStr : `@${other?.username ?? ""}`}
            </p>
          </div>

          <div className="relative">
            <Avatar className="h-44 w-44 ring-4 ring-white/30 shadow-2xl">
              <AvatarImage src={other?.avatar_url ?? undefined} />
              <AvatarFallback className="text-6xl bg-white/20 text-white">
                {other?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {callState === "calling" && (
              <span className="absolute inset-0 rounded-full ring-4 ring-white/40 animate-ping" />
            )}
          </div>

          <div className="flex items-center gap-5">
            {callState === "active" && (
              <Button
                size="icon"
                onClick={toggleMute}
                className={`h-14 w-14 rounded-full ${muted ? "bg-white text-black hover:bg-white/90" : "bg-white/20 hover:bg-white/30 text-white"}`}
              >
                {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
            )}
            {callState === "incoming" && (
              <Button size="icon" onClick={acceptCall} className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600">
                <Phone className="h-7 w-7" />
              </Button>
            )}
            <Button size="icon" variant="destructive" onClick={hangup} className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600">
              <PhoneOff className="h-7 w-7" />
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-2xl px-0 sm:px-4 flex flex-col h-[calc(100vh-9rem)] sm:h-[calc(100vh-12rem)]">
        {/* Messenger-style header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-background sticky top-0 z-10">
          <Link to="/social">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Link to={`/u/${other?.username ?? ""}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={other?.avatar_url ?? undefined} />
                <AvatarFallback>{other?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {otherOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight truncate">{other?.display_name || other?.username || "..."}</p>
              <p className="text-xs text-muted-foreground truncate">
                {otherOnline ? "Active now" : `@${other?.username ?? ""}`}
              </p>
            </div>
          </Link>

          <Button size="icon" variant="ghost" className="rounded-full text-primary h-9 w-9" onClick={startCall} disabled={blockedByMe || blockingMe}>
            <Phone className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="rounded-full text-primary h-9 w-9" onClick={startCall} disabled={blockedByMe || blockingMe} title="Call">
            <Video className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-full h-9 w-9">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              <DropdownMenuItem onClick={() => navigate(`/u/${other?.username ?? ""}`)}>
                <UserIcon className="h-4 w-4 mr-2" />View profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={unfriend}>
                <UserMinus className="h-4 w-4 mr-2" />Unfriend
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {blockedByMe ? (
                <DropdownMenuItem onClick={unblockUser}>
                  <Ban className="h-4 w-4 mr-2" />Unblock
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={blockUser} className="text-destructive">
                  <Ban className="h-4 w-4 mr-2" />Block
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {(blockedByMe || blockingMe) && (
          <div className="bg-muted text-center py-2 text-sm text-muted-foreground">
            {blockedByMe ? "You blocked this user." : "You can't message this user."}
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 px-3 space-y-3 bg-muted/20">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarImage src={other?.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">{other?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="font-semibold">{other?.display_name || other?.username}</p>
              <p className="text-xs text-muted-foreground">Say hi 👋</p>
            </div>
          )}

          {grouped.map((g, gi) => {
            const isMe = g.sender_id === user.id;
            const showAvatar = !isMe;
            return (
              <div key={gi} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {showAvatar && (
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={other?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{other?.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`flex flex-col gap-1 max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  {g.items.map((m, i) => {
                    const isFirst = i === 0;
                    const isLast = i === g.items.length - 1;
                    const radius = isMe
                      ? `${isFirst ? "rounded-tr-2xl" : "rounded-tr-md"} rounded-tl-2xl rounded-bl-2xl ${isLast ? "rounded-br-2xl" : "rounded-br-md"}`
                      : `${isFirst ? "rounded-tl-2xl" : "rounded-tl-md"} rounded-tr-2xl rounded-br-2xl ${isLast ? "rounded-bl-2xl" : "rounded-bl-md"}`;
                    return (
                      <div
                        key={m.id}
                        title={formatTime(m.created_at)}
                        className={`px-3.5 py-2 text-sm break-words ${radius} ${
                          isMe
                            ? "bg-gradient-to-br from-[#0084ff] to-[#0064d8] text-white"
                            : "bg-background border"
                        }`}
                      >
                        {m.content}
                      </div>
                    );
                  })}
                  {g.items[g.items.length - 1] && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      {formatTime(g.items[g.items.length - 1].created_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <div className="flex items-center gap-2 px-3 py-2 border-t bg-background">
          <Button size="icon" variant="ghost" className="text-primary rounded-full h-9 w-9 shrink-0" disabled>
            <ImageIcon className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center bg-muted rounded-full px-3">
            <Input
              placeholder="Aa"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={blockedByMe || blockingMe}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-9"
            />
            <Smile className="h-5 w-5 text-primary opacity-70" />
          </div>
          {text.trim() ? (
            <Button size="icon" onClick={send} className="rounded-full h-9 w-9 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => sendMessage("👍")} disabled={blockedByMe || blockingMe} className="text-primary rounded-full h-9 w-9 shrink-0">
              <ThumbsUp className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
