import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getFeedItems, getUserSocieties, getLeaderboard } from "@/lib/actions/feed";
import { Feed } from "@/components/feed/Feed";
import { 
  Sparkles, 
  Users, 
  Plus,
  Bell,
  Trophy,
  TrendingUp,
} from "lucide-react";

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
}

interface SocietyData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export default async function FeedPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, university")
    .eq("id", user.id)
    .single();

  const profile = profileData as ProfileData | null;

  // Get initial feed items
  const { items, hasMore, error } = await getFeedItems(0);

  // Get user's societies for the sidebar
  const societies = await getUserSocieties() as SocietyData[];

  // Get leaderboard data
  const leaderboard = await getLeaderboard(profile?.university || null);

  return (
    <div className="min-h-screen bg-dark-950 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Profile & Societies */}
          <div className="hidden lg:block space-y-6">
            {/* User Card */}
            <div className="glass rounded-3xl p-6 sticky top-28">
              <div className="flex items-center gap-4 mb-6">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name || "User"}
                    width={48}
                    height={48}
                    className="rounded-2xl ring-2 ring-accent-500/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {profile?.full_name?.[0] || "U"}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">
                    {profile?.full_name || "Welcome!"}
                  </h3>
                  <p className="text-sm text-dark-400">{profile?.university}</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-dark-800/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{societies?.length || 0}</p>
                  <p className="text-xs text-dark-400">Societies</p>
                </div>
                <div className="bg-dark-800/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-white">{items.filter(i => i.type === "event").length}</p>
                  <p className="text-xs text-dark-400">Events</p>
                </div>
              </div>

              {/* Leaderboard */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-medium text-dark-300">Top Societies</h4>
                </div>
                
                {leaderboard.topSocieties.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.topSocieties.map((society, index) => (
                      <Link
                        key={society.id}
                        href={`/societies/${society.slug}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-800/50 transition-colors group"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? "bg-amber-500/20 text-amber-400" :
                          index === 1 ? "bg-slate-400/20 text-slate-300" :
                          index === 2 ? "bg-orange-600/20 text-orange-400" :
                          "bg-dark-700 text-dark-400"
                        }`}>
                          {index + 1}
                        </div>
                        {society.logo_url ? (
                          <Image
                            src={society.logo_url}
                            alt={society.name}
                            width={32}
                            height={32}
                            className="rounded-lg"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {society.name?.[0]}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-dark-300 group-hover:text-white transition-colors truncate block">
                            {society.name}
                          </span>
                          <span className="text-xs text-dark-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {society.member_count} members
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-dark-400 mb-3">No societies yet</p>
                    <Link
                      href="/societies"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Browse Societies
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            {/* Feed Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-accent-400" />
                  Your Feed
                </h1>
                <p className="text-dark-400 mt-1">
                  Updates from your societies at {profile?.university || "your campus"}
                </p>
              </div>
            </div>

            {/* Error State */}
            {error ? (
              <div className="glass rounded-3xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{error}</h3>
                <p className="text-dark-400 mb-4">
                  Update your profile to see content from your university.
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-500 text-white font-medium rounded-xl transition-colors"
                >
                  Update Profile
                </Link>
              </div>
            ) : (
              <Feed initialItems={items} initialHasMore={hasMore} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
