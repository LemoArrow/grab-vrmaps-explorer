import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, UserPlus, UserMinus, Ban, Clock } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

const UserProfile = () => {
  const { username } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = usePresence();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<"none" | "friend" | "pending_out" | "pending_in" | "blocked" | "self">("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  const load = async () => {
    if (!user || !username) return;
    const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
    setProfile(data);
    if (!data) return;
    if (data.user_id === user.id) { setStatus("self"); return; }

    const { data: blk } = await supabase.from("blocks").select("*")
      .eq("blocker_id", user.id).eq("blocked_id", data.user_id).maybeSingle();
    if (blk) { setStatus("blocked"); return; }

    const { data: f } = await supabase.from("friendships").select("*")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${data.user_id}),and(requester_id.eq.${data.user_id},addressee_id.eq.${user.id})`)
      .maybeSingle();
    if (!f) { setStatus("none"); setFriendshipId(null); return; }
    setFriendshipId(f.id);
    if (f.status === "accepted") setStatus("friend");
    else if (f.requester_id === user.id) setStatus("pending_out");
    else setStatus("pending_in");
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, username]);

  const addFriend = async () => {
    const { error } = await supabase.from("friendships").insert({
      requester_id: user!.id, addressee_id: profile!.user_id, status: "pending",
    });
    if (error) toast.error(error.message); else { toast.success("Request sent"); load(); }
  };

  const accept = async () => {
    if (!friendshipId) return;
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    load();
  };

  const removeFriendship = async () => {
    if (!friendshipId) return;
    await supabase.from("friendships").delete().eq("id", friendshipId);
    load();
  };

  const block = async () => {
    if (!profile) return;
    if (friendshipId) await supabase.from("friendships").delete().eq("id", friendshipId);
    const { error } = await supabase.from("blocks").insert({ blocker_id: user!.id, blocked_id: profile.user_id });
    if (error) toast.error(error.message); else { toast.success("Blocked"); load(); }
  };

  const unblock = async () => {
    await supabase.from("blocks").delete().eq("blocker_id", user!.id).eq("blocked_id", profile!.user_id);
    toast.success("Unblocked"); load();
  };

  if (loading || !user) return null;

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl py-6 px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />Back
        </Button>

        {!profile ? (
          <Card className="p-8 text-center text-muted-foreground">User not found.</Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/30" />
            <div className="px-6 pb-6 -mt-12">
              <div className="relative inline-block">
                <Avatar className="h-24 w-24 ring-4 ring-background">
                  <AvatarImage src={profile.avatar_url ?? undefined} />
                  <AvatarFallback className="text-2xl">{profile.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                {isOnline(profile.user_id) && (
                  <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-green-500 ring-4 ring-background" />
                )}
              </div>
              <div className="mt-3">
                <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isOnline(profile.user_id) ? "🟢 Online now" : "Offline"} · Joined {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                {status === "self" && <p className="text-sm text-muted-foreground">This is your profile.</p>}

                {status === "friend" && (
                  <>
                    <Link to={`/chat/${profile.user_id}`}>
                      <Button><MessageCircle className="h-4 w-4 mr-1" />Message</Button>
                    </Link>
                    <Button variant="outline" onClick={removeFriendship}><UserMinus className="h-4 w-4 mr-1" />Unfriend</Button>
                    <Button variant="ghost" onClick={block}><Ban className="h-4 w-4 mr-1" />Block</Button>
                  </>
                )}

                {status === "none" && (
                  <>
                    <Button onClick={addFriend}><UserPlus className="h-4 w-4 mr-1" />Add Friend</Button>
                    <Button variant="ghost" onClick={block}><Ban className="h-4 w-4 mr-1" />Block</Button>
                  </>
                )}

                {status === "pending_out" && (
                  <>
                    <Button variant="outline" disabled><Clock className="h-4 w-4 mr-1" />Request sent</Button>
                    <Button variant="ghost" onClick={removeFriendship}>Cancel</Button>
                  </>
                )}

                {status === "pending_in" && (
                  <>
                    <Button onClick={accept}>Accept request</Button>
                    <Button variant="outline" onClick={removeFriendship}>Decline</Button>
                  </>
                )}

                {status === "blocked" && (
                  <Button variant="outline" onClick={unblock}><Ban className="h-4 w-4 mr-1" />Unblock</Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default UserProfile;
