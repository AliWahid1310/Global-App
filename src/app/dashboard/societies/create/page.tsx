"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { canCreateSocietyClient } from "@/lib/auth/roles.client";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { addCreatorAsAdmin } from "@/lib/actions/membership";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { getUserFriendlyError } from "@/lib/utils/errors";
import { Loader2, ArrowLeft, Sparkles, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { SocietyStatus } from "@/types/database";

export default function CreateSocietyPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [university, setUniversity] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<SocietyStatus>("pending");
  const router = useRouter();
  const supabase = createClient();

  // Check user permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login?redirect=/dashboard/societies/create");
        return;
      }

      const permissions = await canCreateSocietyClient(user.id);
      setIsPlatformAdmin(permissions.isPlatformAdmin);
      setDefaultStatus(permissions.defaultStatus);
      setChecking(false);
    };

    checkPermissions();
  }, [supabase.auth, router]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a society");
      }

      // Re-check permissions to get correct status
      const permissions = await canCreateSocietyClient(user.id);

      let logoUrl: string | null = null;
      let bannerUrl: string | null = null;

      // Upload images to Cloudinary in parallel for faster upload
      const uploadPromises: Promise<any>[] = [];
      
      if (logoFile || bannerFile) {
        setLoadingStatus("Uploading images...");
      }
      
      if (logoFile) {
        uploadPromises.push(
          uploadToCloudinary(logoFile, "societies/logos").then(result => {
            logoUrl = result.secure_url;
          })
        );
      }

      if (bannerFile) {
        uploadPromises.push(
          uploadToCloudinary(bannerFile, "societies/banners").then(result => {
            bannerUrl = result.secure_url;
          })
        );
      }

      // Wait for all uploads to complete in parallel
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      setLoadingStatus("Creating society...");
      const slug = generateSlug(name);

      // Create society with appropriate status
      const societyData = {
        name,
        slug,
        description,
        category: category || null,
        university: university || null,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        created_by: user.id,
        is_public: true,
        status: permissions.defaultStatus, // 'approved' for admins, 'pending' for normal users
        contact_phone: phoneNumber || null, // Store phone for verification
      };

      const { data: society, error: societyError } = await supabase
        .from("societies")
        .insert(societyData as any)
        .select()
        .single();

      if (societyError) throw societyError;

      // Add creator as admin member of the society using secure server action
      const memberResult = await addCreatorAsAdmin((society as any).id, user.id);

      if (memberResult.error) throw new Error(memberResult.error);

      // Show success message for pending societies, redirect for approved
      if (permissions.defaultStatus === "pending") {
        setSuccess(true);
      } else {
        router.push(`/societies/${slug}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Academic",
    "Arts",
    "Cultural",
    "Environmental",
    "Gaming",
    "Media",
    "Music",
    "Social",
    "Sports",
    "Technology",
    "Volunteering",
    "Other",
  ];

  // Loading state while checking permissions
  if (checking) {
    return (
      <div className="bg-dark-950 min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-400" />
      </div>
    );
  }

  // Success state for pending requests
  if (success) {
    return (
      <div className="bg-dark-950 min-h-screen pt-24 pb-8 relative">
        <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
        <div className="noise-overlay" />
        
        <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="glass rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-3">
              Request Submitted!
            </h1>
            <p className="text-dark-300 mb-6">
              Your society request for <span className="text-accent-400 font-medium">{name}</span> has been submitted and is pending approval from a platform administrator.
            </p>
            <p className="text-dark-400 text-sm mb-8">
              You&apos;ll be notified once your request is reviewed.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-8 relative">
      <div className="absolute inset-0 bg-gradient-radial from-accent-900/10 via-transparent to-transparent" />
      <div className="noise-overlay" />
      
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-dark-300 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        <div className="glass rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-accent-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">
                {isPlatformAdmin ? "Create New Society" : "Request New Society"}
              </h1>
              <p className="text-sm text-dark-400">
                {isPlatformAdmin 
                  ? "Your society will be live immediately" 
                  : "Your request will be reviewed by an admin"}
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className={`mb-6 px-4 py-3 rounded-xl flex items-center gap-3 ${
            isPlatformAdmin 
              ? "bg-green-500/10 border border-green-500/20" 
              : "bg-amber-500/10 border border-amber-500/20"
          }`}>
            {isPlatformAdmin ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-300 text-sm">
                  As a platform admin, your society will be created and approved instantly.
                </span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-amber-400" />
                <span className="text-amber-300 text-sm">
                  Your society will need admin approval before becoming visible.
                </span>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Society Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                placeholder="e.g., Computer Science Club"
              />
              {name && (
                <p className="mt-2 text-sm text-dark-400">
                  URL: /societies/{generateSlug(name)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-100 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                placeholder="Tell us about your society..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  University *
                </label>
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                  placeholder="e.g., University of Example"
                />
              </div>
            </div>

            {/* Phone Number - Required for non-admin users */}
            {!isPlatformAdmin && (
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Contact Phone Number *
                </label>
                <PhoneInput
                  value={phoneNumber}
                  onChange={(value, isValid) => {
                    setPhoneNumber(value);
                    setIsPhoneValid(isValid);
                  }}
                  required
                />
                <p className="mt-2 text-xs text-accent-400 font-medium">
                  💡 We may contact you to verify your request and ensure legitimacy. Your number won&apos;t be shared publicly.
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6 mt-8">
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Logo Image
                </label>
                <ImageUpload
                  onFileSelect={setLogoFile}
                  aspectRatio="square"
                  placeholder="Upload logo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Banner Image
                </label>
                <ImageUpload
                  onFileSelect={setBannerFile}
                  aspectRatio="banner"
                  placeholder="Upload banner"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 border border-dark-600 text-dark-200 rounded-xl hover:bg-dark-800 transition-all text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !name || !university || (!isPlatformAdmin && !isPhoneValid)}
                className="w-full sm:w-auto px-6 py-3 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center btn-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {loadingStatus || (isPlatformAdmin ? "Creating..." : "Submitting...")}
                  </>
                ) : (
                  isPlatformAdmin ? "Create Society" : "Submit Request"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
