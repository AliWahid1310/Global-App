import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import type { Post, Profile, Society } from "@/types/database";
import { User, Calendar, Pin } from "lucide-react";

interface PostCardProps {
  post: Post & {
    author?: Profile | null;
    society?: Society | null;
  };
}

export function PostCard({ post }: PostCardProps) {
  return (
    <div className="glass-light rounded-2xl overflow-hidden hover:border-accent-500/30 transition-all duration-300 group">
      {post.image_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={post.image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 to-transparent" />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          {post.society && (
            <Link
              href={`/societies/${post.society.slug}`}
              className="text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors"
            >
              {post.society.name}
            </Link>
          )}
          {post.is_pinned && (
            <Pin className="h-4 w-4 text-accent-400 fill-accent-400" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-white mt-2 line-clamp-2 group-hover:text-accent-300 transition-colors">
          {post.title}
        </h3>
        {post.content && (
          <p className="text-dark-300 mt-2 text-sm line-clamp-3">
            {post.content}
          </p>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
          <div className="flex items-center text-sm text-dark-400">
            <User className="h-4 w-4 mr-1.5" />
            <span>{post.author?.full_name || "Anonymous"}</span>
          </div>
          <div className="flex items-center text-sm text-dark-400">
            <Calendar className="h-4 w-4 mr-1.5" />
            <span>{format(new Date(post.created_at), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
