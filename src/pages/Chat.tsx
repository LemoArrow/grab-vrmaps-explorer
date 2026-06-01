import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, PhoneOff, Send, Mic, MicOff } from "lucide-react";
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

const Chat = () => {
  const { userId } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<Profile | null>(null);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Call state
  const [callState, setCallState] = useState<"idle" | "calling" | "incoming" | "active">("idle");
  const [muted, setMuted] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const signalChRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  const callChannelName = user && userId ? `call-${[user.id, userId].sort().join("-")}` : "";

  const loadMessages = useCallback(async () => {
    if (!user || !userId) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
  }, [user, userId]);

  useEffect(() => {
    if (!user || !userId) return;
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => setOther(data));
    loadMessages();
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
  }, [user, userId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !user || !userId) return;
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ sender_id: user.id, receiver_id: userId, content });
    if (error) toast.error(error.message);
  };

  // ---------- WebRTC calling ----------
  const cleanupCall = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    incomingOfferRef.current = null;
    setCallState("idle");
    setMuted(false);
  }, []);

  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection(ICE);
    pc.onicecandidate = (e) => {
      if (e.candidate && signalChRef.current) {
        signalChRef.current.send({ type: "broadcast", event: "ice", payload: { from: user!.id, candidate: e.candidate } });
      }
    };
    pc.ontrack = (e) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
      }
    };
    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        cleanupCall();
      }
    };
    pcRef.current = pc;
    return pc;
  }, [user, cleanupCall]);

  // Signaling channel
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
        setCallState("active");
      }
    });
    ch.on("broadcast", { event: "ice" }, async ({ payload }) => {
      if (payload.from === user.id) return;
      try { await pcRef.current?.addIceCandidate(payload.candidate); } catch {}
    });
    ch.on("broadcast", { event: "hangup" }, () => {
      cleanupCall();
      toast("Call ended");
    });
    ch.subscribe();
    signalChRef.current = ch;
    return () => { supabase.removeChannel(ch); signalChRef.current = null; };
  }, [user, userId, callChannelName, cleanupCall]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      const pc = createPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalChRef.current?.send({ type: "broadcast", event: "offer", payload: { from: user!.id, sdp: offer } });
      setCallState("calling");
    } catch (e: any) {
      toast.error("Mic access denied");
      cleanupCall();
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
      setCallState("active");
    } catch {
      toast.error("Mic access denied");
      cleanupCall();
    }
  };

  const hangup = () => {
    signalChRef.current?.send({ type: "broadcast", event: "hangup", payload: { from: user!.id } });
    cleanupCall();
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); }
  };

  if (loading || !user) return null;

  return (
    <Layout>
      <audio ref={remoteAudioRef} autoPlay />
      <div className="container mx-auto max-w-2xl py-4 px-4 flex flex-col h-[calc(100vh-12rem)]">
        <div className="flex items-center gap-3 pb-3 border-b">
          <Link to="/social"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <Avatar><AvatarImage src={other?.avatar_url ?? undefined} /><AvatarFallback>{other?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
          <div className="flex-1">
            <p className="font-medium">{other?.display_name || other?.username || "..."}</p>
            <p className="text-xs text-muted-foreground">@{other?.username}</p>
          </div>
          {callState === "idle" && (
            <Button size="icon" onClick={startCall}><Phone className="h-4 w-4" /></Button>
          )}
          {callState !== "idle" && (
            <>
              {callState === "active" && (
                <Button size="icon" variant="outline" onClick={toggleMute}>
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              <Button size="icon" variant="destructive" onClick={hangup}><PhoneOff className="h-4 w-4" /></Button>
            </>
          )}
        </div>

        {callState !== "idle" && (
          <div className="bg-muted/50 text-center py-2 text-sm">
            {callState === "calling" && "Calling..."}
            {callState === "incoming" && (
              <div className="flex items-center justify-center gap-2">
                <span>Incoming call</span>
                <Button size="sm" onClick={acceptCall}>Accept</Button>
                <Button size="sm" variant="destructive" onClick={hangup}>Decline</Button>
              </div>
            )}
            {callState === "active" && "In call"}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                m.sender_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && <p className="text-center text-muted-foreground text-sm">Say hi 👋</p>}
        </div>

        <div className="flex gap-2 pt-3 border-t">
          <Input placeholder="Message..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <Button onClick={send}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
