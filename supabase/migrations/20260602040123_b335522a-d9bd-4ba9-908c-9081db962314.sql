CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own blocks (either side)" ON public.blocks
FOR SELECT TO authenticated
USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Create own blocks" ON public.blocks
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Delete own blocks" ON public.blocks
FOR DELETE TO authenticated
USING (auth.uid() = blocker_id);

CREATE INDEX idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON public.blocks(blocked_id);