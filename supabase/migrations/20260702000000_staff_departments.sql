-- ============================================================
-- STAFF DEPARTMENTS & INTERCOM ORCHESTRATION
-- Adds optional department grouping for staff members.
-- Updates Intercom channel type to support 'department'.
-- Grants Managers/Owners read access to ALL org channels.
-- ============================================================

-- 1. Add department column to organization_members
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 2. Add department to organization_invites so it's preserved on acceptance
ALTER TABLE public.organization_invites
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 3. Update intercom_channels type constraint to include 'department'
ALTER TABLE public.intercom_channels
  DROP CONSTRAINT IF EXISTS intercom_channels_type_check;

ALTER TABLE public.intercom_channels
  ADD CONSTRAINT intercom_channels_type_check
    CHECK (type IN ('direct', 'location', 'department', 'custom'));

-- 4. Drop old member-only policies and add manager-bypass RLS

-- intercom_channels: Managers/Owners can see ALL channels in their org
DROP POLICY IF EXISTS "Organization members can read their organization's channels" ON public.intercom_channels;

CREATE POLICY "Members can read their organization channels"
ON public.intercom_channels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = intercom_channels.organization_id
    AND om.user_id = auth.uid()
    -- Members see channels they are in, OR if they are owner/manager they see all
    AND (
      om.role IN ('owner', 'manager')
      OR EXISTS (
        SELECT 1 FROM public.intercom_channel_members icm
        WHERE icm.channel_id = intercom_channels.id
        AND icm.user_id = auth.uid()
      )
    )
  )
);

-- intercom_messages: Managers/Owners can read ALL messages in their org's channels
DROP POLICY IF EXISTS "Members of a channel can read messages" ON public.intercom_messages;

CREATE POLICY "Members or managers can read channel messages"
ON public.intercom_messages
FOR SELECT
USING (
  -- Regular members: must be in the channel
  EXISTS (
    SELECT 1 FROM public.intercom_channel_members icm
    WHERE icm.channel_id = intercom_messages.channel_id
    AND icm.user_id = auth.uid()
  )
  OR
  -- Managers/Owners: can read any message in their org
  EXISTS (
    SELECT 1 FROM public.intercom_channels c
    JOIN public.organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = intercom_messages.channel_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'manager')
  )
);

-- Managers can also send messages to any channel in their org
DROP POLICY IF EXISTS "Members of a channel can send messages" ON public.intercom_messages;

CREATE POLICY "Members or managers can send messages"
ON public.intercom_messages
FOR INSERT
WITH CHECK (
  -- Regular members: must be in the channel
  EXISTS (
    SELECT 1 FROM public.intercom_channel_members icm
    WHERE icm.channel_id = intercom_messages.channel_id
    AND icm.user_id = auth.uid()
  )
  OR
  -- Managers/Owners: can send to any channel in their org
  EXISTS (
    SELECT 1 FROM public.intercom_channels c
    JOIN public.organization_members om ON om.organization_id = c.organization_id
    WHERE c.id = intercom_messages.channel_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'manager')
  )
);

-- 5. Performance indexes
CREATE INDEX IF NOT EXISTS idx_org_members_department
  ON public.organization_members(organization_id, department)
  WHERE department IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_intercom_channels_dept
  ON public.intercom_channels(organization_id, type)
  WHERE type = 'department';
