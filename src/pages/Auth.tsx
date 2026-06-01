import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/social");
  }, [user, navigate]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else navigate("/social");
  };

  const signUp = async () => {
    if (!username.trim()) return toast.error("Pick a username");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/social`,
        data: { username: username.trim(), display_name: username.trim() },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created!"); navigate("/social"); }
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-md py-12">
        <h1 className="text-3xl font-bold mb-6 text-center">Welcome</h1>
        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3 mt-4">
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button className="w-full" onClick={signIn} disabled={loading}>Sign In</Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 mt-4">
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Password (min 6 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button className="w-full" onClick={signUp} disabled={loading}>Create Account</Button>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Auth;
