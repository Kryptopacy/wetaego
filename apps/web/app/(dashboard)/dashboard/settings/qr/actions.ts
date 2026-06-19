"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateQrConfig(
  locationId: string,
  config: { qr_text?: string | null; qr_color?: string | null; logo_url?: string | null }
) {
  const supabase = await createClient();

  const updatePayload: any = {
    qr_text: config.qr_text,
    qr_color: config.qr_color,
    logo_url: config.logo_url,
  };

  const { error } = await supabase
    .from("locations")
    .update(updatePayload)
    .eq("id", locationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/settings/qr");
  return { success: true };
}
