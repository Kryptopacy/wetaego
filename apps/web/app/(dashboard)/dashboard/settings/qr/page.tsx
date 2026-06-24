import { ActionForm } from '@/components/ActionForm'
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QrSettingsClient } from "./QrSettingsClient";

export default async function QrSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's org
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!member) {
    redirect("/dashboard");
  }

  const { data: location } = await supabase
    .from("locations")
    .select("*")
    .eq("organization_id", member.organization_id)
    .limit(1)
    .single();

  if (!location) {
    redirect("/dashboard/locations");
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">QR Generator</h1>
        <p className="text-muted-foreground mt-2">
          Customize and download premium QR codes for your ecosystem.
        </p>
      </div>
      <QrSettingsClient location={location} />
    </div>
  );
}
