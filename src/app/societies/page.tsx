import { createClient } from "@/lib/supabase/server";
import { SocietyCard } from "@/components/society/SocietyCard";
import { CategoryFilter } from "@/components/society/CategoryFilter";
import { Search, Sparkles } from "lucide-react";
import type { Society } from "@/types/database";

export const revalidate = 60;

export default async function SocietiesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("societies")
    .select("*")
    .eq("is_public", true)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  const { data: societiesData } = await query;
  const societies = (societiesData || []) as Society[];

  // Get unique categories (only from approved societies)
  const { data: categoriesData } = await supabase
    .from("societies")
    .select("category")
    .eq("is_public", true)
    .eq("status", "approved")
    .not("category", "is", null);

  const categories = (categoriesData || []) as Pick<Society, 'category'>[];
  const uniqueCategories = [
    ...new Set(categories.map((c) => c.category).filter(Boolean)),
  ];

  return (
    <div className="bg-dark-950 min-h-screen pt-24">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-400" />
            <span className="text-sm text-accent-400 font-medium">Discover</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Find your circle
          </h1>
          <p className="text-xl text-dark-200 max-w-2xl">
            Explore communities that match your vibe. No overwhelming lists, just curated spaces for people like you.
          </p>

          {/* Search and filters */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 max-w-2xl">
            <form className="flex-1" action="/societies" method="GET">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-300" />
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search}
                  placeholder="Search societies..."
                  className="w-full pl-12 pr-4 py-4 bg-dark-800 border border-dark-600 rounded-2xl text-white placeholder-dark-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                />
              </div>
            </form>
            <CategoryFilter 
              categories={uniqueCategories as string[]} 
              currentCategory={params.category} 
            />
          </div>
        </div>
      </div>

      {/* Societies Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {societies.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {societies.map((society) => (
              <SocietyCard key={society.id} society={society} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-full bg-dark-800 flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No societies found</h3>
            <p className="text-dark-300">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
