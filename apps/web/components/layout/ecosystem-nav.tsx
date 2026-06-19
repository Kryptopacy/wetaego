import { createClient } from "@/lib/supabase/server";
import { EcosystemNavClient } from "./ecosystem-nav-client";

export async function EcosystemNav({ locationId, slug, currentPath }: { locationId: string; slug: string; currentPath: string }) {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("location_pages")
    .select("id, slug, title, template_type")
    .eq("location_id", locationId)
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  // If there are no custom pages, we don't need a navigation menu (other than maybe returning to the main menu).
  // But if there are, we pass them down.
  const hasPages = pages && pages.length > 0;

  if (!hasPages) return null;

  return <EcosystemNavClient slug={slug} pages={pages} currentPath={currentPath} />;
}
