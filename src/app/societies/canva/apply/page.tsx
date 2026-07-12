import { redirect } from "next/navigation";
import Link from "next/link";
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

  // Get user's profile to check university
  const { data: profileData } = await supabase
    .from("profiles")
    .select("university")
    .eq("id", user.id)
    .single();

  const profile = profileData as { university: string | null } | null;
  const university = profile?.university || "";
  const isAirUniversity = university.toLowerCase().includes("air university");

  if (!isAirUniversity) {
    return (
      <div className="min-h-screen bg-dark-950 pt-24 pb-12">
        <div className="max-w-xl mx-auto px-6">
          <div className="glass rounded-3xl p-8 border border-red-500/25 bg-gradient-to-br from-red-950/20 via-dark-950 to-dark-900 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-white">Eligibility Restricted</h2>
            <p className="text-dark-200 text-sm leading-relaxed">
              This application is exclusively open to students of <strong>Air University</strong>. 
              {university ? (
                <> Your profile indicates you are from <strong>{university}</strong>.</>
              ) : (
                <> You have not set your university in your profile yet.</>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/profile"
                className="px-6 py-3 bg-accent-600 hover:bg-accent-500 text-white font-semibold rounded-xl transition-all"
              >
                Update Profile
              </Link>
              <Link
                href="/feed"
                className="px-6 py-3 border border-dark-700 hover:border-dark-500 text-dark-200 hover:text-white font-semibold rounded-xl transition-all"
              >
                Back to Feed
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user already applied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
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
