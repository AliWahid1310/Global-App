import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CanvaApplicationForm from "@/components/society/CanvaApplicationForm";

export const revalidate = 0;

export default async function CanvaApplyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/societies/canva/apply`);
  }

  // Check if user already applied
  const { data: existing } = await supabase
    .from("canva_applications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const alreadyApplied = !!existing;

  return (
    <div className="min-h-screen bg-dark-950 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-display font-bold text-white mb-4">
          Canva Student Community Executive Team Applications | Air University
        </h1>

        {alreadyApplied ? (
          <div className="glass-light rounded-3xl p-8 text-center">
            <p className="text-dark-200">You have already submitted an application.</p>
          </div>
        ) : (
          <CanvaApplicationForm userId={user.id} />
        )}
      </div>
    </div>
  );
}
