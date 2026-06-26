"use server";



import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateQrConfigSchema = z.object({
  locationId: z.string().uuid(),
  config: z.object({
    qr_text: z.string().nullable().optional(),
    qr_color: z.string().nullable().optional(),
    logo_url: z.string().nullable().optional(),
  })
});

export async function updateQrConfig(
  locationId: string,
  config: { qr_text?: string | null; qr_color?: string | null; logo_url?: string | null }
) {
  const supabase = await createClient();

  const parsed = updateQrConfigSchema.safeParse({ locationId, config });
  if (!parsed.success) {
    throw new Error("Invalid parameters");
  }

  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) throw new Error("Not authenticated");

  const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', locationId).single();
  if (!loc) throw new Error("Location not found");

  const { data: member } = await supabase.from('organization_members').select('role').eq('organization_id', loc.organization_id).eq('user_id', userData.user.id).single();
  let isAuthorized = !!member;
  if (!member) {
    const { data: org } = await supabase.from('organizations').select('id').eq('id', loc.organization_id).eq('created_by', userData.user.id).single();
    isAuthorized = !!org;
  }
  if (!isAuthorized) throw new Error("Unauthorized");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {
    qr_text: config.qr_text ? config.qr_text.substring(0, 2) : null,
    qr_color: config.qr_color,
    logo_url: config.logo_url,
  };

  const { error } = await supabase
    .from("locations")
    .update(updatePayload)
    .eq("id", locationId);

  if (error) {
    throw new Error((error as Error).message);
  }

  revalidatePath("/dashboard/settings/qr");
  return { success: true };
}
