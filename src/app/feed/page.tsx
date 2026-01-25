import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getFeedItems, getUserSocieties } from "@/lib/actions/feed";
import { Feed } from "@/components/feed/Feed";
import { 
  Sparkles, 
  Users, 
  Plus,
  Bell,
  TrendingUp,
  Calendar,
  Zap,
  Flame,
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

              {/* My Societies */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-dark-300">My Societies</h4>
                  <Link
                    href="/societies"
                    className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
                  >
                    Browse all
                  </Link>
                </div>
                
                {societies && societies.length > 0 ? (
                  <div className="space-y-2">
                    {societies.slice(0, 5).map((society: SocietyData) => (
                      <Link
                        key={society.id}
                        href={`/societies/${society.slug}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-800/50 transition-colors group"
                      >
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
                        <span className="text-sm text-dark-300 group-hover:text-white transition-colors truncate">
                          {society.name}
                        </span>
                      </Link>
                    ))}
                    {societies.length > 5 && (
                      <Link
                        href="/dashboard"
                        className="block text-center text-xs text-dark-400 hover:text-accent-400 py-2"
                      >
                        +{societies.length - 5} more
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-dark-400 mb-3">No societies yet</p>
                    <Link
                      href="/societies"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Join Societies
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
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

          {/* Right Sidebar - Trending & Suggestions */}
          <div className="hidden lg:block space-y-6">
            {/* Trending Topics */}
            <div className="glass rounded-3xl p-5 sticky top-28">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-semibold text-white">Trending Now</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { tag: "Freshers Week", posts: 128, hot: true },
                  { tag: "Career Fair 2026", posts: 89 },
                  { tag: "Study Groups", posts: 67 },
                  { tag: "Basketball League", posts: 45 },
                  { tag: "Cultural Night", posts: 34 },
                ].map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-dark-800/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-dark-500">#{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-accent-400 transition-colors flex items-center gap-2">
                          {topic.tag}
                          {topic.hot && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white">
                              HOT
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-dark-400">{topic.posts} posts</p>
                      </div>
                    </div>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-accent-500/20 to-purple-500/20">
                  <Zap className="w-5 h-5 text-accent-400" />
                </div>
                <h3 className="font-semibold text-white">Quick Actions</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/events"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-all hover:scale-105 group"
                >
                  <Calendar className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                  <span className="text-xs text-dark-300 group-hover:text-white">Events</span>
                </Link>
                <Link
                  href="/societies"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-all hover:scale-105 group"
                >
                  <Users className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-xs text-dark-300 group-hover:text-white">Societies</span>
                </Link>
                <Link
                  href="/dashboard/societies/create"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-all hover:scale-105 group"
                >
                  <Plus className="w-6 h-6 text-green-400 group-hover:text-green-300" />
                  <span className="text-xs text-dark-300 group-hover:text-white">Create</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-all hover:scale-105 group"
                >
                  <Sparkles className="w-6 h-6 text-amber-400 group-hover:text-amber-300" />
                  <span className="text-xs text-dark-300 group-hover:text-white">Profile</span>
                </Link>
              </div>
            </div>

            {/* Suggested Societies */}
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white">Discover</h3>
                </div>
                <Link href="/societies" className="text-xs text-accent-400 hover:text-accent-300">
                  See all
                </Link>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: "Tech Innovators", members: "2.3k", color: "from-blue-500 to-cyan-500" },
                  { name: "Music Society", members: "1.8k", color: "from-purple-500 to-pink-500" },
                  { name: "Debate Club", members: "1.2k", color: "from-orange-500 to-red-500" },
                ].map((society, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-800/50 transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${society.color} flex items-center justify-center`}>
                      <span className="text-sm font-bold text-white">{society.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{society.name}</p>
                      <p className="text-xs text-dark-400">{society.members} members</p>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-medium bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            <div className="px-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-dark-500">
                <a href="#" className="hover:text-dark-300">About</a>
                <a href="#" className="hover:text-dark-300">Privacy</a>
                <a href="#" className="hover:text-dark-300">Terms</a>
                <a href="#" className="hover:text-dark-300">Help</a>
              </div>
              <p className="text-xs text-dark-600 mt-2">© 2026 Circl</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
