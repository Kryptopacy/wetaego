-- 1. Intercom Channels
CREATE TABLE IF NOT EXISTS public.intercom_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('direct', 'location', 'custom')),
  name TEXT, -- Nullable for direct messages
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.intercom_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can read their organization's channels"
ON public.intercom_channels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = intercom_channels.organization_id
    AND organization_members.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can create channels"
ON public.intercom_channels
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = intercom_channels.organization_id
    AND organization_members.user_id = auth.uid()
  )
);


-- 2. Intercom Channel Members
CREATE TABLE IF NOT EXISTS public.intercom_channel_members (
  channel_id UUID NOT NULL REFERENCES public.intercom_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (channel_id, user_id)
);

ALTER TABLE public.intercom_channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can read channel members"
ON public.intercom_channel_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.intercom_channels c
    JOIN public.organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = intercom_channel_members.channel_id
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can insert channel members"
ON public.intercom_channel_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.intercom_channels c
    JOIN public.organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = intercom_channel_members.channel_id
    AND om.user_id = auth.uid()
  )
);


-- 3. Intercom Messages
CREATE TABLE IF NOT EXISTS public.intercom_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.intercom_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_text TEXT,
  media_url TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (content_text IS NOT NULL OR media_url IS NOT NULL OR audio_url IS NOT NULL)
);

ALTER TABLE public.intercom_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members of a channel can read messages"
ON public.intercom_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.intercom_channel_members icm
    WHERE icm.channel_id = intercom_messages.channel_id
    AND icm.user_id = auth.uid()
  )
);

CREATE POLICY "Members of a channel can send messages"
ON public.intercom_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.intercom_channel_members icm
    WHERE icm.channel_id = intercom_messages.channel_id
    AND icm.user_id = auth.uid()
  )
);

CREATE TRIGGER set_intercom_messages_updated_at
BEFORE UPDATE ON public.intercom_messages
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 4. Storage Bucket for Intercom Media (Private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('intercom-media', 'intercom-media', false) 
ON CONFLICT (id) DO NOTHING;

-- Staff can upload to intercom-media
CREATE POLICY "Auth Insert Intercom Media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'intercom-media' AND auth.role() = 'authenticated'
);

-- Staff can read from intercom-media
CREATE POLICY "Auth Select Intercom Media" ON storage.objects
FOR SELECT USING (
  bucket_id = 'intercom-media' AND auth.role() = 'authenticated'
);
