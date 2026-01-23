"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { Profile } from "@/types/database";
import { User, Mail, Building, Loader2, ArrowLeft, Save, Shield } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const profile = profileData as Profile | null;

      if (profile) {
        setProfile(profile);
        setFullName(profile.full_name || "");
        setUniversity(profile.university || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setMessage(null);

    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        const result = await uploadToCloudinary(avatarFile, "avatars");
        avatarUrl = result.secure_url;
      }

      const { error } = await (supabase
        .from("profiles") as any)
        .update({
          full_name: fullName,
          university: university || null,
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, full_name: fullName, university, avatar_url: avatarUrl });
      setMessage({ type: "success", text: "Profile updated successfully!" });
      router.refresh();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    );
  }

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-8 relative">
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-dark-300 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="glass rounded-3xl p-8">
          <h1 className="text-2xl font-display font-bold text-white mb-6">
            Edit Profile
          </h1>

          <form onSubmit={handleSave} className="space-y-6">
            {message && (
              <div
                className={`px-4 py-3 rounded-xl text-sm ${
                  message.type === "success"
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-dark-700 flex items-center justify-center ring-4 ring-dark-600">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-dark-400" />
                  )}
                </div>
                <div className="flex-1">
                  <ImageUpload
                    onFileSelect={setAvatarFile}
                    aspectRatio="square"
                    placeholder="Upload new photo"
                    currentImage={profile?.avatar_url || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-dark-500" />
                </div>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-dark-800/50 border border-dark-700 rounded-xl text-dark-400 cursor-not-allowed"
                />
              </div>
              <p className="mt-2 text-xs text-dark-500">
                Email cannot be changed
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-dark-400" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                  placeholder="Your full name"
                />
              </div>
            </div>

            {/* University */}
            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                University
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-dark-400" />
                </div>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                  placeholder="Your university"
                />
              </div>
            </div>

            {/* Admin Badge */}
            {profile?.is_admin && (
              <div className="flex items-center gap-3 p-4 bg-accent-500/10 border border-accent-500/20 rounded-xl">
                <div className="w-10 h-10 bg-accent-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent-400" />
                </div>
                <div>
                  <span className="text-accent-400 font-medium">Admin</span>
                  <p className="text-sm text-dark-300">
                    You have admin privileges on this platform
                  </p>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-3 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
