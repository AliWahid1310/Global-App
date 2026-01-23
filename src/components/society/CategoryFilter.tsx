"use client";

import { Filter } from "lucide-react";

interface CategoryFilterProps {
  categories: string[];
  currentCategory?: string;
}

export function CategoryFilter({ categories, currentCategory }: CategoryFilterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href);
    if (e.target.value) {
      url.searchParams.set("category", e.target.value);
    } else {
      url.searchParams.delete("category");
    }
    window.location.href = url.toString();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-300 pointer-events-none" />
        <select
          className="appearance-none pl-11 pr-10 py-4 bg-dark-800 border border-dark-600 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all cursor-pointer"
          defaultValue={currentCategory || ""}
          onChange={handleChange}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="h-4 w-4 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
