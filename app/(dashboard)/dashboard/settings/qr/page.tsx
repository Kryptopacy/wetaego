import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QrSettingsClient } from "./QrSettingsClient";
import { PageHeader } from "@/components/ui/page-header";

export default async function QrSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's org
  let orgId: string | null = null;
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (member) {
    orgId = member.organization_id;
  } else {
    // Check if user is the creator (Owner) of the org
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', user.id).limit(1).maybeSingle();
    if (org) {
      orgId = org.id;
    }
  }

  if (!orgId) {
    redirect("/dashboard");
  }

  const { data: location } = await supabase
    .from("locations")
    .select("*")
    .eq("organization_id", orgId)
    .limit(1)
    .single();

  if (!location) {
    redirect("/dashboard/locations");
  }

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <PageHeader
        title="QR Code Studio"
        description="Customize, style, and download high-resolution dynamic QR codes for table stands and storefront windows."
      />
      <QrSettingsClient location={location} />
    </div>
  );
}
