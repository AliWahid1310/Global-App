"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { Post, Profile } from "@/types/database";
import {
  Plus,
  Loader2,
  Trash2,
  Pin,
  PinOff,
  X,
  Globe,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface PostManagerProps {
  societyId: string;
  posts: (Post & { author: Profile | null })[];
}

export function PostManager({ societyId, posts }: PostManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showInFeed, setShowInFeed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [optimisticPosts, setOptimisticPosts] = useState<(Post & { author: Profile | null })[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const router = useRouter();
  const supabase = createClient();

  // Combine real posts with optimistic ones, excluding deleted
  const displayPosts = [...optimisticPosts, ...posts.filter(p => !deletedIds.includes(p.id))];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      let imageUrl: string | null = null;

      if (imageFile) {
        const result = await uploadToCloudinary(imageFile, "posts");
        imageUrl = result.secure_url;
      }

      const postData = {
        society_id: societyId,
        author_id: user.id,
        title,
        content,
        image_url: imageUrl,
        show_in_feed: showInFeed,
      };

      // Create optimistic post
      const optimisticPost: Post & { author: Profile | null } = {
        id: `temp-${Date.now()}`,
        society_id: societyId,
        author_id: user.id,
        title,
        content,
        image_url: imageUrl,
        is_pinned: false,
        show_in_feed: showInFeed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: { id: user.id, email: user.email || '', full_name: user.user_metadata?.full_name || 'You', avatar_url: null, university: null, is_admin: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      };

      // Show optimistic update immediately
      setOptimisticPosts(prev => [optimisticPost, ...prev]);
      setTitle("");
      setContent("");
      setImageFile(null);
      setShowInFeed(true);
      setShowForm(false);

      const { error } = await (supabase.from("posts") as any).insert(postData);

      if (error) {
        // Revert optimistic update on error
        setOptimisticPosts(prev => prev.filter(p => p.id !== optimisticPost.id));
        throw error;
      }

      // Clear optimistic posts after refresh brings real data
      router.refresh();
      setTimeout(() => setOptimisticPosts([]), 1000);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    // Optimistic delete - hide immediately
    setDeletedIds(prev => [...prev, postId]);
    
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);

      if (error) {
        // Revert on error
        setDeletedIds(prev => prev.filter(id => id !== postId));
        throw error;
      }
      router.refresh();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleTogglePin = async (postId: string, currentlyPinned: boolean) => {
    setLoadingId(postId);
    try {
      const { error } = await (supabase
        .from("posts") as any)
        .update({ is_pinned: !currentlyPinned })
        .eq("id", postId);

      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error("Error toggling pin:", error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      {/* Create Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-dark-600 rounded-xl text-dark-300 hover:border-accent-500 hover:text-accent-400 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create New Post
        </button>
      )}

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-5 border border-dark-700 rounded-xl bg-dark-800/50"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-white">New Post</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="Post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                placeholder="Write your announcement..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1">
                Image (optional)
              </label>
              <ImageUpload onFileSelect={setImageFile} aspectRatio="banner" />
            </div>

            {/* Visibility Option */}
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowInFeed(true)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    showInFeed
                      ? "border-accent-500 bg-accent-500/10 text-white"
                      : "border-dark-600 bg-dark-800/50 text-dark-300 hover:border-dark-500"
                  }`}
                >
                  <Globe className={`h-5 w-5 ${showInFeed ? "text-accent-400" : "text-dark-400"}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium">University Feed</p>
                    <p className="text-xs text-dark-400">Visible to everyone</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInFeed(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    !showInFeed
                      ? "border-accent-500 bg-accent-500/10 text-white"
                      : "border-dark-600 bg-dark-800/50 text-dark-300 hover:border-dark-500"
                  }`}
                >
                  <Users className={`h-5 w-5 ${!showInFeed ? "text-accent-400" : "text-dark-400"}`} />
                  <div className="text-left">
                    <p className="text-sm font-medium">Society Only</p>
                    <p className="text-xs text-dark-400">Only on society page</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 text-dark-300 hover:text-white hover:bg-dark-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title}
                className="px-5 py-2.5 bg-accent-500 text-white rounded-xl hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Post"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Posts List */}
      <div className="mt-4 space-y-3">
        {displayPosts.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-6">
            No posts yet. Create your first announcement!
          </p>
        ) : (
          displayPosts.map((post) => (
            <div
              key={post.id}
              className="flex items-start justify-between p-4 bg-dark-800/50 border border-dark-700 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {post.is_pinned && (
                    <Pin className="h-4 w-4 text-accent-400" />
                  )}
                  <h4 className="font-medium text-white truncate">
                    {post.title}
                  </h4>
                </div>
                <p className="text-sm text-dark-300 mt-1 line-clamp-2">
                  {post.content}
                </p>
                <p className="text-xs text-dark-400 mt-2">
                  By {post.author?.full_name || "Unknown"} •{" "}
                  {format(new Date(post.created_at), "MMM d, yyyy")}
                </p>
              </div>

              <div className="flex items-center gap-1 ml-4">
                {loadingId === post.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-dark-400" />
                ) : (
                  <>
                    <button
                      onClick={() => handleTogglePin(post.id, post.is_pinned)}
                      className={`p-2 rounded-lg transition-colors ${
                        post.is_pinned
                          ? "text-accent-400 hover:bg-accent-500/20"
                          : "text-dark-400 hover:bg-dark-700 hover:text-white"
                      }`}
                      title={post.is_pinned ? "Unpin" : "Pin"}
                    >
                      {post.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
