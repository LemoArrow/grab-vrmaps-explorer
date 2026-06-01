-- 1. Friendship escalation fix
DROP POLICY IF EXISTS "Update own friendships" ON public.friendships;

-- Addressee can accept/change status
CREATE POLICY "Addressee can update friendship status"
ON public.friendships FOR UPDATE TO authenticated
USING (auth.uid() = addressee_id)
WITH CHECK (auth.uid() = addressee_id);

-- Requester can update their own row but cannot mark it accepted (they can still cancel via DELETE)
CREATE POLICY "Requester can update own pending request"
ON public.friendships FOR UPDATE TO authenticated
USING (auth.uid() = requester_id AND status = 'pending')
WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- 2. Profiles: authenticated-only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

CREATE POLICY "Profiles viewable by authenticated"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- 3. Realtime broadcast channel RLS (used by WebRTC call signaling).
-- Only allow authenticated users to read/write broadcast messages on topics that include their own uid.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own call channels" ON realtime.messages;
DROP POLICY IF EXISTS "Users can write own call channels" ON realtime.messages;

CREATE POLICY "Users can read own call channels"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'call-%' || (auth.uid())::text || '%'
);

CREATE POLICY "Users can write own call channels"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'call-%' || (auth.uid())::text || '%'
);