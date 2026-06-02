import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  MessageCircle, UserPlus, Check, X, LogOut, MoreVertical,
  Ban, UserMinus, User as UserIcon, Copy, Search, Globe,
} from "lucide-react";

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

interface BlockRow {
  id: string;
  blocker_id: string;
  blocked_id: string;
  profile?: Profile;
}

const PresenceDot = ({ online }: { online: boolean }) => (
  <span
    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-background ${
      online ? "bg-green-500" : "bg-muted-foreground/40"
    }`}
  />
);

const UserAvatar = ({ p, online }: { p?: Profile; online: boolean }) => (
  <div className="relative">
    <Avatar className="h-11 w-11">
      <AvatarImage src={p?.avatar_url ?? undefined} />
      <AvatarFallback>{p?.username?.[0]?.toUpperCase()}</AvatarFallback>
    </Avatar>
    <PresenceDot online={online} />
  </div>
);

const Social = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = usePresence();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [directory, setDirectory] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  useEffect(() => { if (!loading && !user) navigate("/auth"); }, [user, loading, navigate]);

  const loadAll = useCallback(async () => {
    if (!user) return;

    const [{ data: fs }, { data: bs }, { data: dir }] = await Promise.all([
      supabase.from("friendships").select("*")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
      supabase.from("blocks").select("*").eq("blocker_id", user.id),
      supabase.from("profiles").select("*")
        .neq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);

    const fsList = fs ?? [];
    const bsList = bs ?? [];

    const otherIds = [
      ...fsList.map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id)),
      ...bsList.map((b) => b.blocked_id),
    ];
    const { data: profiles } = otherIds.length
      ? await supabase.from("profiles").select("*").in("user_id", otherIds)
      : { data: [] as Profile[] };
    const map = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    setFriendships(fsList.map((f) => ({
      ...f, profile: map.get(f.requester_id === user.id ? f.addressee_id : f.requester_id),
    })));
    setBlocks(bsList.map((b) => ({ ...b, profile: map.get(b.blocked_id) })));
    setDirectory(dir ?? []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setMyProfile(data));
    loadAll();
    const ch = supabase
      .channel("social-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "blocks" }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, loadAll]);

  const blockedIds = new Set(blocks.map((b) => b.blocked_id));
  const friendshipMap = new Map<string, Friendship>();
  friendships.forEach((f) => {
    const other = f.requester_id === user?.id ? f.addressee_id : f.requester_id;
    friendshipMap.set(other, f);
  });

  const doSearch = async () => {
    if (!search.trim()) { setResults([]); return; }
    const { data } = await supabase
      .from("profiles").select("*")
      .ilike("username", `%${search.trim()}%`)
      .neq("user_id", user!.id).limit(20);
    setResults(data ?? []);
  };

  const sendRequest = async (addresseeId: string) => {
    const { error } = await supabase.from("friendships").insert({
      requester_id: user!.id, addressee_id: addresseeId, status: "pending",
    });
    if (error) toast.error(error.message); else { toast.success("Friend request sent"); loadAll(); }
  };

  const respond = async (id: string, accept: boolean) => {
    if (accept) await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    else await supabase.from("friendships").delete().eq("id", id);
    loadAll();
  };

  const removeFriend = async (id: string) => {
    await supabase.from("friendships").delete().eq("id", id);
    loadAll();
  };

  const blockUser = async (uid: string) => {
    const fs = friendshipMap.get(uid);
    if (fs) await supabase.from("friendships").delete().eq("id", fs.id);
    const { error } = await supabase.from("blocks").insert({ blocker_id: user!.id, blocked_id: uid });
    if (error) toast.error(error.message); else { toast.success("User blocked"); loadAll(); }
  };

  const unblockUser = async (uid: string) => {
    await supabase.from("blocks").delete().eq("blocker_id", user!.id).eq("blocked_id", uid);
    toast.success("Unblocked"); loadAll();
  };

  const copyUsername = (u: string) => {
    navigator.clipboard.writeText(`@${u}`);
    toast.success("Username copied");
  };

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user?.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user?.id);

  // Sort friends: online first
  const sortedAccepted = [...accepted].sort((a, b) => {
    const ao = isOnline(a.profile?.user_id ?? "") ? 1 : 0;
    const bo = isOnline(b.profile?.user_id ?? "") ? 1 : 0;
    return bo - ao;
  });

  const onlineCount = accepted.filter((f) => isOnline(f.profile?.user_id ?? "")).length;

  const RowMenu = ({ p, isFriend, friendshipId }: { p: Profile; isFriend: boolean; friendshipId?: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover">
        <DropdownMenuItem onClick={() => navigate(`/u/${p.username}`)}>
          <UserIcon className="h-4 w-4 mr-2" />View profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/chat/${p.user_id}`)}>
          <MessageCircle className="h-4 w-4 mr-2" />Message
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyUsername(p.username)}>
          <Copy className="h-4 w-4 mr-2" />Copy username
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {isFriend && friendshipId && (
          <DropdownMenuItem onClick={() => removeFriend(friendshipId)} className="text-destructive">
            <UserMinus className="h-4 w-4 mr-2" />Remove friend
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => blockUser(p.user_id)} className="text-destructive">
          <Ban className="h-4 w-4 mr-2" />Block user
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const PersonCard = ({ p, action, isFriend = false, friendshipId }: {
    p: Profile; action?: React.ReactNode; isFriend?: boolean; friendshipId?: string;
  }) => (
    <Card className="p-3 flex items-center gap-3 hover:bg-accent/30 transition-colors">
      <Link to={`/u/${p.username}`} className="shrink-0">
        <UserAvatar p={p} online={isOnline(p.user_id)} />
      </Link>
      <Link to={`/u/${p.username}`} className="flex-1 min-w-0">
        <p className="font-medium truncate">{p.display_name || p.username}</p>
        <p className="text-sm text-muted-foreground truncate">
          @{p.username} {isOnline(p.user_id) && <span className="text-green-600">• Active now</span>}
        </p>
      </Link>
      {action}
      <RowMenu p={p} isFriend={isFriend} friendshipId={friendshipId} />
    </Card>
  );

  if (loading || !user) return null;

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {myProfile && (
              <Link to={`/u/${myProfile.username}`}>
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={myProfile.avatar_url ?? undefined} />
                    <AvatarFallback>{myProfile.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <PresenceDot online />
                </div>
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold leading-tight">Friends</h1>
              {myProfile && (
                <p className="text-sm text-muted-foreground">
                  @{myProfile.username} · {onlineCount} active
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />Sign Out
          </Button>
        </div>

        <Tabs defaultValue="friends">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="friends">Friends ({accepted.length})</TabsTrigger>
            <TabsTrigger value="requests">
              Requests {incoming.length > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{incoming.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="discover"><Globe className="h-3.5 w-3.5 mr-1" />Discover</TabsTrigger>
            <TabsTrigger value="blocked">Blocked ({blocks.length})</TabsTrigger>
          </TabsList>

          {/* FRIENDS */}
          <TabsContent value="friends" className="space-y-2 mt-4">
            {accepted.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No friends yet. Find some in Discover!</p>
            )}
            {sortedAccepted.map((f) => f.profile && (
              <PersonCard
                key={f.id} p={f.profile} isFriend friendshipId={f.id}
                action={
                  <Link to={`/chat/${f.profile.user_id}`}>
                    <Button size="sm" className="rounded-full">
                      <MessageCircle className="h-4 w-4 mr-1" />Chat
                    </Button>
                  </Link>
                }
              />
            ))}
          </TabsContent>

          {/* REQUESTS */}
          <TabsContent value="requests" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Incoming</h3>
              {incoming.length === 0 && <p className="text-sm text-muted-foreground">No incoming requests</p>}
              <div className="space-y-2">
                {incoming.map((f) => f.profile && (
                  <PersonCard key={f.id} p={f.profile} action={
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => respond(f.id, true)} className="rounded-full">
                        <Check className="h-4 w-4 mr-1" />Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => respond(f.id, false)} className="rounded-full">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  } />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Sent</h3>
              {outgoing.length === 0 && <p className="text-sm text-muted-foreground">No outgoing requests</p>}
              <div className="space-y-2">
                {outgoing.map((f) => f.profile && (
                  <PersonCard key={f.id} p={f.profile} action={
                    <Button size="sm" variant="ghost" onClick={() => removeFriend(f.id)}>Cancel</Button>
                  } />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* DISCOVER */}
          <TabsContent value="discover" className="space-y-3 mt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9 rounded-full" placeholder="Search people..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doSearch()} />
              </div>
              <Button onClick={doSearch} className="rounded-full">Search</Button>
            </div>

            {(results.length > 0 ? results : directory)
              .filter((p) => !blockedIds.has(p.user_id))
              .map((p) => {
                const fs = friendshipMap.get(p.user_id);
                const isFriend = fs?.status === "accepted";
                let action: React.ReactNode = (
                  <Button size="sm" className="rounded-full" onClick={() => sendRequest(p.user_id)}>
                    <UserPlus className="h-4 w-4 mr-1" />Add
                  </Button>
                );
                if (isFriend) {
                  action = (
                    <Link to={`/chat/${p.user_id}`}>
                      <Button size="sm" className="rounded-full">
                        <MessageCircle className="h-4 w-4 mr-1" />Chat
                      </Button>
                    </Link>
                  );
                } else if (fs?.status === "pending") {
                  action = <span className="text-xs text-muted-foreground px-2">Pending</span>;
                }
                return <PersonCard key={p.user_id} p={p} action={action} isFriend={isFriend} friendshipId={fs?.id} />;
              })}

            {results.length === 0 && directory.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No users to discover yet.</p>
            )}
          </TabsContent>

          {/* BLOCKED */}
          <TabsContent value="blocked" className="space-y-2 mt-4">
            {blocks.length === 0 && (
              <p className="text-muted-foreground text-center py-8">You haven't blocked anyone.</p>
            )}
            {blocks.map((b) => b.profile && (
              <Card key={b.id} className="p-3 flex items-center gap-3">
                <UserAvatar p={b.profile} online={false} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{b.profile.display_name || b.profile.username}</p>
                  <p className="text-sm text-muted-foreground truncate">@{b.profile.username}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => unblockUser(b.blocked_id)} className="rounded-full">
                  Unblock
                </Button>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Social;
