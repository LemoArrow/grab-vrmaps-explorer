import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { MessageCircle, UserPlus, Check, X, LogOut } from "lucide-react";

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  profile?: Profile;
}

const Social = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const loadFriendships = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (!data) return;
    const otherIds = data.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", otherIds);
    const map = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
    setFriendships(data.map((f) => ({ ...f, profile: map.get(f.requester_id === user.id ? f.addressee_id : f.requester_id) })));
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setMyProfile(data));
    loadFriendships();
    const ch = supabase
      .channel("friendships-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => loadFriendships())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const doSearch = async () => {
    if (!search.trim()) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${search.trim()}%`)
      .neq("user_id", user!.id)
      .limit(20);
    setResults(data ?? []);
  };

  const sendRequest = async (addresseeId: string) => {
    const { error } = await supabase.from("friendships").insert({
      requester_id: user!.id,
      addressee_id: addresseeId,
      status: "pending",
    });
    if (error) toast.error(error.message);
    else { toast.success("Friend request sent"); loadFriendships(); }
  };

  const respond = async (id: string, accept: boolean) => {
    if (accept) {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    } else {
      await supabase.from("friendships").delete().eq("id", id);
    }
    loadFriendships();
  };

  const removeFriend = async (id: string) => {
    await supabase.from("friendships").delete().eq("id", id);
    loadFriendships();
  };

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user?.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user?.id);

  const friendIds = new Set(friendships.map((f) => f.profile?.user_id));

  if (loading || !user) return null;

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Friends</h1>
            {myProfile && <p className="text-muted-foreground">@{myProfile.username}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
        </div>

        <Tabs defaultValue="friends">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="friends">Friends ({accepted.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({incoming.length})</TabsTrigger>
            <TabsTrigger value="find">Find People</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-2 mt-4">
            {accepted.length === 0 && <p className="text-muted-foreground text-center py-8">No friends yet. Find some!</p>}
            {accepted.map((f) => (
              <Card key={f.id} className="p-3 flex items-center gap-3">
                <Avatar><AvatarImage src={f.profile?.avatar_url ?? undefined} /><AvatarFallback>{f.profile?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="font-medium">{f.profile?.display_name || f.profile?.username}</p>
                  <p className="text-sm text-muted-foreground">@{f.profile?.username}</p>
                </div>
                <Link to={`/chat/${f.profile?.user_id}`}>
                  <Button size="sm"><MessageCircle className="h-4 w-4 mr-1" />Chat</Button>
                </Link>
                <Button size="sm" variant="ghost" onClick={() => removeFriend(f.id)}><X className="h-4 w-4" /></Button>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Incoming</h3>
              {incoming.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
              {incoming.map((f) => (
                <Card key={f.id} className="p-3 flex items-center gap-3 mb-2">
                  <Avatar><AvatarFallback>{f.profile?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1"><p>@{f.profile?.username}</p></div>
                  <Button size="sm" onClick={() => respond(f.id, true)}><Check className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => respond(f.id, false)}><X className="h-4 w-4" /></Button>
                </Card>
              ))}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Sent</h3>
              {outgoing.length === 0 && <p className="text-sm text-muted-foreground">None</p>}
              {outgoing.map((f) => (
                <Card key={f.id} className="p-3 flex items-center gap-3 mb-2">
                  <Avatar><AvatarFallback>{f.profile?.username?.[0]?.toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1"><p>@{f.profile?.username}</p><p className="text-xs text-muted-foreground">Pending</p></div>
                  <Button size="sm" variant="ghost" onClick={() => removeFriend(f.id)}>Cancel</Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="find" className="space-y-3 mt-4">
            <div className="flex gap-2">
              <Input placeholder="Search by username" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} />
              <Button onClick={doSearch}>Search</Button>
            </div>
            {results.map((p) => (
              <Card key={p.user_id} className="p-3 flex items-center gap-3">
                <Avatar><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback>{p.username[0].toUpperCase()}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="font-medium">{p.display_name || p.username}</p>
                  <p className="text-sm text-muted-foreground">@{p.username}</p>
                </div>
                {friendIds.has(p.user_id) ? (
                  <span className="text-sm text-muted-foreground">Already connected</span>
                ) : (
                  <Button size="sm" onClick={() => sendRequest(p.user_id)}><UserPlus className="h-4 w-4 mr-1" />Add</Button>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Social;
