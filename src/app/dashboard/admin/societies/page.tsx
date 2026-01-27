import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { ArrowLeft, Shield, Users, Clock, MapPin, Phone } from "lucide-react";
import { ApprovalActions } from "@/app/dashboard/admin/societies/ApprovalActions";
import type { Society, Profile } from "@/types/database";

type SocietyWithCreator = Society & { creator: Profile | null };

export default async function AdminSocietiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is platform admin
  const isAdmin = await isPlatformAdmin(user.id);
  
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch pending societies with creator info
  const { data: pendingSocietiesData } = await supabase
    .from("societies")
    .select(`
      *,
      creator:profiles!societies_created_by_fkey(*)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const pendingSocieties = (pendingSocietiesData || []) as SocietyWithCreator[];

  // Fetch recently approved/rejected societies
  const { data: recentSocietiesData } = await supabase
    .from("societies")
    .select(`
      *,
      creator:profiles!societies_created_by_fkey(*)
    `)
    .in("status", ["approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(10);

  const recentSocieties = (recentSocietiesData || []) as SocietyWithCreator[];

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-12 relative">
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-dark-300 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <Shield className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              Society Requests
            </h1>
            <p className="text-dark-300">
              Review and approve society creation requests
            </p>
          </div>
        </div>

        {/* Pending Requests */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Pending Requests ({pendingSocieties.length})
          </h2>

          {pendingSocieties.length > 0 ? (
            <div className="space-y-4">
              {pendingSocieties.map((society) => (
                <div
                  key={society.id}
                  className="glass rounded-2xl p-6 border border-amber-500/20"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Society Logo */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-800">
                        {society.logo_url ? (
                          <Image
                            src={society.logo_url}
                            alt={society.name}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-dark-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Society Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {society.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-dark-300">
                            {society.category && (
                              <span className="px-2 py-0.5 bg-accent-500/20 text-accent-300 rounded-full text-xs">
                                {society.category}
                              </span>
                            )}
                            {society.university && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {society.university}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Creator Info */}
                        {society.creator && (
                          <div className="text-sm text-dark-400">
                            <span>Requested by </span>
                            <span className="text-white font-medium">
                              {society.creator.full_name || society.creator.email}
                            </span>
                          </div>
                        )}
                      </div>

                      {society.description && (
                        <p className="text-dark-300 text-sm mb-3 line-clamp-2">
                          {society.description}
                        </p>
                      )}

                      {/* Contact Phone for verification */}
                      {society.contact_phone && (
                        <div className="flex items-center gap-2 text-sm text-dark-300 mb-4 bg-dark-800/50 px-3 py-2 rounded-lg w-fit">
                          <Phone className="w-4 h-4 text-accent-400" />
                          <span>Contact: </span>
                          <a 
                            href={`tel:${society.contact_phone}`}
                            className="text-accent-400 hover:text-accent-300 font-medium"
                          >
                            {society.contact_phone}
                          </a>
                        </div>
                      )}

                      {/* Actions */}
                      <ApprovalActions societyId={society.id} societyName={society.name} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-dark-200 text-lg">All caught up!</p>
              <p className="text-dark-400 text-sm mt-1">
                No pending society requests to review.
              </p>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        {recentSocieties.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              Recent Activity
            </h2>
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Society
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-300 uppercase tracking-wider">
                      Creator
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {recentSocieties.map((society) => (
                    <tr key={society.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-700 flex-shrink-0">
                            {society.logo_url ? (
                              <Image
                                src={society.logo_url}
                                alt={society.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-dark-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-white font-medium">{society.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            society.status === "approved"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {society.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-dark-300 text-sm">
                        {society.creator?.full_name || society.creator?.email || "Unknown"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
