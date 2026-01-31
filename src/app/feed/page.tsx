import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getFeedItems, getUserSocieties, getLeaderboard } from "@/lib/actions/feed";
import { Feed } from "@/components/feed/Feed";
import { 
  Sparkles, 
  Users, 
  Bell,
  Trophy,
  TrendingUp,
  Flame,
  Crown,
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
          {/* Left Sidebar - Leaderboard */}
          <div className="hidden lg:block">
            <div className="glass rounded-3xl p-5 sticky top-28 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">Leaderboard</h3>
              </div>

              {/* Top Societies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <h4 className="text-xs font-medium text-dark-200 uppercase tracking-wide">Top This Month</h4>
                </div>
                {leaderboard.topSocieties.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.topSocieties.map((society, index) => (
                      <Link
                        key={society.id}
                        href={`/societies/${society.slug}`}
                        className="flex items-center gap-2 p-2 rounded-xl hover:bg-dark-800/50 transition-colors group"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
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
                            width={28}
                            height={28}
                            className="rounded-lg"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-600 to-accent-800 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">
                              {society.name?.[0]}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-white group-hover:text-accent-300 transition-colors truncate flex-1">
                          {society.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dark-300 text-center py-2">No data yet</p>
                )}
              </div>

              {/* Fastest Growing */}
              {leaderboard.fastestGrowing.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <h4 className="text-xs font-medium text-dark-200 uppercase tracking-wide">Fastest Growing</h4>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.fastestGrowing.map((society) => (
                      <Link
                        key={society.id}
                        href={`/societies/${society.slug}`}
                        className="flex items-center gap-2 p-2 rounded-xl hover:bg-dark-800/50 transition-colors group"
                      >
                        {society.logo_url ? (
                          <Image
                            src={society.logo_url}
                            alt={society.name}
                            width={28}
                            height={28}
                            className="rounded-lg"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">
                              {society.name?.[0]}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-white group-hover:text-accent-300 transition-colors truncate flex-1">
                          {society.name}
                        </span>
                        <span className="text-xs text-green-400">↑</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Most Active Members */}
              {leaderboard.mostActive.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-medium text-dark-200 uppercase tracking-wide">Active Members</h4>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.mostActive.map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 rounded-xl"
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          index === 0 ? "bg-purple-500/20 text-purple-400" :
                          "bg-dark-700 text-dark-400"
                        }`}>
                          {index + 1}
                        </div>
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.full_name || "Member"}
                            width={28}
                            height={28}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">
                              {member.full_name?.[0] || "?"}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white truncate block">
                            {member.full_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-dark-300">{member.society_count} societies</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
