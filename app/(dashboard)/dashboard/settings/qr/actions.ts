"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/lib/safe-action";

export const updateQrConfig = authActionClient
  .schema(z.object({
    locationId: z.string().uuid(),
    config: z.object({
      qr_text: z.string().nullable().optional(),
      qr_color: z.string().nullable().optional(),
      logo_url: z.string().nullable().optional(),
    })
  }))
  .action(async ({ parsedInput: { locationId, config }, ctx: { supabase, user } }) => {
    const { data: loc } = await supabase.from('locations').select('organization_id').eq('id', locationId).single();
    if (!loc) throw new Error("Location not found");

    const { data: member } = await supabase.from('organization_members').select('role').eq('organization_id', loc.organization_id).eq('user_id', user.id).single();
    let isAuthorized = !!member;
    if (!member) {
      const { data: org } = await supabase.from('organizations').select('id').eq('id', loc.organization_id).eq('created_by', user.id).limit(1).maybeSingle();
      isAuthorized = !!org;
    }
    if (!isAuthorized) throw new Error("Unauthorized");

    
    const updatePayload: import('@/lib/supabase/types').Database['public']['Tables']['locations']['Update'] = {
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
  });
