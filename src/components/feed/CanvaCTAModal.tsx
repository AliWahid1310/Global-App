"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ArrowRight,
  Sparkles,
  Palette,
  Lock,
  UserPlus,
  LogIn,
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CanvaCTAModalProps {
  isLoggedIn: boolean;
  userId?: string;
  alreadyApplied?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science",
  "Software Engineering",
  "Artificial Intelligence",
  "Cyber Security",
  "Data Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Mechatronics",
  "Business Administration",
  "Psychology",
  "Mathematics",
  "Other",
];

const CAMPUSES = ["Main Campus, E-9", "H-11 Campus"];

const ROLES = [
  "Events Team",
  "Marketing & Promotions",
  "Social Media Management",
  "Graphic Design",
  "Photography/Videography",
  "Content Writing",
  "Public Relations",
  "Community Engagement",
  "Logistics & Operations",
  "I'm open to any role",
];

// ─── Application Form ────────────────────────────────────────────────────────
function ApplicationForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [otherDepartment, setOtherDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [campus, setCampus] = useState(CAMPUSES[0]);
  const [volunteered, setVolunteered] = useState<string | null>(null);
  const [memberOfOrg, setMemberOfOrg] = useState<string | null>(null);
  const [orgNames, setOrgNames] = useState("");
  const [usedCanva, setUsedCanva] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [firstPreference, setFirstPreference] = useState("");
  const [experience, setExperience] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [skills, setSkills] = useState("");
  const [goals, setGoals] = useState("");
  const [agreement, setAgreement] = useState<string | null>(null);

  function toggleRole(role: string) {
    setRoles((r) => (r.includes(role) ? r.filter((x) => x !== role) : [...r, role]));
  }

  function validate() {
    if (!fullName.trim()) return "Full Name is required";
    if (!email.trim()) return "University Email is required";
    if (!phone.trim()) return "Phone Number is required";
    if (!department) return "Department is required";
    if (department === "Other" && !otherDepartment.trim()) return "Please enter your department";
    if (!semester.trim()) return "Current Semester is required";
    if (!campus) return "Campus is required";
    if (volunteered === null) return "Please indicate volunteering experience";
    if (memberOfOrg === null) return "Please indicate society membership";
    if (!usedCanva) return "Please indicate your Canva experience";
    if (roles.length === 0) return "Please select at least one role";
    if (!experience.trim()) return "Please describe your experience";
    if (!whyJoin.trim()) return "Please answer why you want to join";
    if (!skills.trim()) return "Please describe your unique skills";
    if (!goals.trim()) return "Please describe what you'd like to achieve";
    if (agreement !== "agree") return "You must agree to the terms";
    return null;
  }

  function validateStep(currentStep: number): string | null {
    if (currentStep === 1) {
      if (!fullName.trim()) return "Full Name is required";
      if (!email.trim()) return "University Email is required";
      if (!phone.trim()) return "Phone Number is required";
      if (!department) return "Department is required";
      if (department === "Other" && !otherDepartment.trim()) return "Please enter your department";
      if (!semester.trim()) return "Current Semester is required";
      if (!campus) return "Campus is required";
    }
    if (currentStep === 2) {
      if (volunteered === null) return "Please indicate volunteering experience";
      if (memberOfOrg === null) return "Please indicate society membership";
      if (!usedCanva) return "Please indicate your Canva experience";
    }
    if (currentStep === 3) {
      if (roles.length === 0) return "Please select at least one role";
      if (!experience.trim()) return "Please describe your experience";
    }
    if (currentStep === 4) {
      if (!whyJoin.trim()) return "Please answer why you want to join";
      if (!skills.trim()) return "Please describe your unique skills";
      if (!goals.trim()) return "Please describe what you'd like to achieve";
    }
    if (currentStep === 5) {
      if (agreement !== "agree") return "You must agree to the terms";
    }
    return null;
  }

  function handleStepClick(targetStep: number) {
    if (targetStep < step) {
      setError(null);
      setStep(targetStep);
      return;
    }
    for (let s = step; s < targetStep; s++) {
      const err = validateStep(s);
      if (err) {
        setError(err);
        return;
      }
    }
    setError(null);
    setStep(targetStep);
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(5, s + 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const vErr = validate();
    if (vErr) { setError(vErr); return; }
    setLoading(true);
    try {
      const payload = {
        full_name: fullName,
        university_email: email,
        phone_number: phone,
        department: department === "Other" ? otherDepartment : department,
        current_semester: semester,
        campus,
        volunteered: volunteered === "yes",
        member_of_org: memberOfOrg === "yes",
        org_names: orgNames || null,
        used_canva: usedCanva,
        roles,
        first_preference: firstPreference || null,
        experience,
        linkedin,
        motivation_why: whyJoin,
        motivation_skills: skills,
        motivation_goals: goals,
        agreement: agreement === "agree",
      };

      const res = await fetch("/api/canva-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        window.location.href = `/login?redirect=/societies/canva/apply`;
        return;
      }
      if (res.status === 409) { setError("You have already submitted an application."); return; }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error || "Failed to submit application");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.refresh(), 800);
    } catch (err: any) {
      setError(err?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Application Submitted! 🎉</h2>
        <p className="text-dark-200 max-w-sm">
          Thank you for applying to the Canva Student Community at Air University. We&apos;ll be in touch soon!
        </p>
      </div>
    );
  }

  // Step indicators
  const steps = ["Personal Info", "About You", "Roles", "Motivation", "Agreement"];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      {/* Step Progress */}
      <div className="px-6 pt-2 pb-5 border-b border-dark-700/50">
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <button
                type="button"
                onClick={() => handleStepClick(i + 1)}
                className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                  step === i + 1
                    ? "bg-accent-500 text-white scale-110 shadow-lg shadow-accent-500/30"
                    : step > i + 1
                    ? "bg-green-500/30 text-green-400"
                    : "bg-dark-800 text-dark-500"
                }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </button>
              <span className={`text-[10px] font-medium hidden sm:block truncate ${step === i + 1 ? "text-accent-300" : step > i + 1 ? "text-green-400" : "text-dark-500"}`}>
                {s}
              </span>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mx-1 ${step > i + 1 ? "bg-green-500/40" : "bg-dark-700"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* ── Step 1: Personal Info ── */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="font-semibold text-white text-lg mb-1">🎨 Personal Information</h3>
              <p className="text-dark-400 text-sm">Tell us about yourself</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Full Name *</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">University Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@au.edu.pk"
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Phone Number *</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 3XX XXXXXXX"
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all text-sm"
                >
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {department === "Other" && (
                  <input
                    placeholder="Please specify your department"
                    value={otherDepartment}
                    onChange={(e) => setOtherDepartment(e.target.value)}
                    className="w-full mt-2 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Current Semester *</label>
                <input
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. 4th Semester"
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Campus *</label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all text-sm"
                >
                  {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: About You ── */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="font-semibold text-white text-lg mb-1">✨ About You</h3>
              <p className="text-dark-400 text-sm">Share your background and experience</p>
            </div>

            <div>
              <p className="text-sm font-medium text-dark-200 mb-3">Have you ever volunteered in a university event? *</p>
              <div className="flex gap-3">
                {["yes", "no"].map((v) => (
                  <label key={v} className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer transition-all ${volunteered === v ? "border-accent-500 bg-accent-500/10 text-accent-300" : "border-dark-700 bg-dark-800/50 text-dark-100 hover:border-dark-500"}`}>
                    <input type="radio" name="volunteered" value={v} onChange={() => setVolunteered(v)} className="sr-only" />
                    <span className="capitalize font-medium text-sm">{v === "yes" ? "Yes" : "No"}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-dark-200 mb-3">Are you currently a member of any university society or organization? *</p>
              <div className="flex gap-3">
                {["yes", "no"].map((v) => (
                  <label key={v} className={`flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer transition-all ${memberOfOrg === v ? "border-accent-500 bg-accent-500/10 text-accent-300" : "border-dark-700 bg-dark-800/50 text-dark-100 hover:border-dark-500"}`}>
                    <input type="radio" name="memberOfOrg" value={v} onChange={() => setMemberOfOrg(v)} className="sr-only" />
                    <span className="capitalize font-medium text-sm">{v === "yes" ? "Yes" : "No"}</span>
                  </label>
                ))}
              </div>
            </div>

            {memberOfOrg === "yes" && (
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Which society/organization(s)? (Optional)</label>
                <input
                  value={orgNames}
                  onChange={(e) => setOrgNames(e.target.value)}
                  placeholder="e.g. ACM, GDSC, IEEE..."
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Have you ever used Canva? *</label>
              <select
                value={usedCanva}
                onChange={(e) => setUsedCanva(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
              >
                <option value="">Select your experience level</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Never Used</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Step 3: Roles ── */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="font-semibold text-white text-lg mb-1">🎯 Role Preferences</h3>
              <p className="text-dark-400 text-sm">Select all roles you&apos;re interested in</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${roles.includes(r) ? "border-accent-500 bg-accent-500/10 text-accent-300" : "border-dark-700 bg-dark-800/30 text-dark-100 hover:border-dark-500"}`}>
                  <div className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${roles.includes(r) ? "border-accent-500 bg-accent-500" : "border-dark-600"}`}>
                    {roles.includes(r) && <span className="text-[8px] text-white font-bold">✓</span>}
                  </div>
                  <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} className="sr-only" />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">First preference role (Optional)</label>
              <select
                value={firstPreference}
                onChange={(e) => setFirstPreference(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
              >
                <option value="">No specific preference</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Describe any relevant experience you have *</label>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={4}
                placeholder="Tell us about your experience related to the roles you selected..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">LinkedIn Profile (Optional)</label>
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Motivation ── */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="font-semibold text-white text-lg mb-1">💫 Motivation</h3>
              <p className="text-dark-400 text-sm">Share your passion and vision</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Please don&apos;t use AI for writing these answers! We want to hear your genuine thoughts.</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Why do you want to join the Canva Student Community at Air University? *</label>
              <textarea
                value={whyJoin}
                onChange={(e) => setWhyJoin(e.target.value)}
                rows={4}
                placeholder="Share your genuine motivation..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">What unique skills or qualities will you bring to the team? *</label>
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={4}
                placeholder="What makes you stand out..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">If selected, what would you like to achieve during your time as a volunteer? *</label>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={4}
                placeholder="Your goals and vision..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* ── Step 5: Agreement ── */}
        {step === 5 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="font-semibold text-white text-lg mb-1">📋 Agreement</h3>
              <p className="text-dark-400 text-sm">Please read and agree to the following</p>
            </div>

            <div className="p-5 bg-dark-800/60 border border-dark-700 rounded-2xl space-y-3">
              <p className="text-sm font-medium text-dark-100 mb-3">By submitting this application, I understand that:</p>
              <ul className="space-y-2">
                {[
                  "I am applying to become a volunteer for the Canva Student Community at Air University Islamabad.",
                  "This is not employment, an internship, or an official staff position at Canva.",
                  "Volunteer responsibilities include attending meetings, supporting events, and completing assigned tasks.",
                  "I will communicate professionally and respectfully with fellow volunteers.",
                  "I will contribute actively to the growth of the student community.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-dark-300">
                    <span className="text-accent-400 mt-0.5 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              {["agree", "disagree"].map((v) => (
                <label key={v} className={`flex items-center gap-3 px-5 py-4 rounded-xl border cursor-pointer transition-all flex-1 ${agreement === v ? (v === "agree" ? "border-green-500 bg-green-500/10 text-green-300" : "border-red-500 bg-red-500/10 text-red-300") : "border-dark-700 bg-dark-800/50 text-dark-100 hover:border-dark-500"}`}>
                  <input type="radio" name="agreement" value={v} onChange={() => setAgreement(v)} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${agreement === v ? (v === "agree" ? "border-green-500 bg-green-500" : "border-red-500 bg-red-500") : "border-dark-600"}`}>
                    {agreement === v && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                  </div>
                  <span className="font-semibold text-sm capitalize">{v === "agree" ? "I Agree ✓" : "I Disagree"}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-6 py-4 border-t border-dark-700/50 flex items-center justify-between gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-5 py-2.5 rounded-xl border border-dark-700 text-dark-100 text-sm font-medium hover:border-dark-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="flex items-center gap-1.5">
          {[1,2,3,4,5].map((s) => (
            <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all ${s === step ? "bg-accent-500 w-4" : s < step ? "bg-green-500/60" : "bg-dark-700"}`} />
          ))}
        </div>

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white text-sm font-semibold transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-accent-500/25"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Auth Gate ───────────────────────────────────────────────────────────────
function AuthGate() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-12 px-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500/20 to-purple-500/20 border border-accent-500/30 flex items-center justify-center mb-6">
        <Lock className="w-9 h-9 text-accent-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">Sign in to Apply</h3>
      <p className="text-dark-100 text-sm max-w-xs mb-8 leading-relaxed">
        You need to create an account or log in to access the Canva Student Community application form.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/login?redirect=/societies/canva/apply"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-accent-600 hover:bg-accent-500 text-white font-semibold text-sm transition-all shadow-lg shadow-accent-500/20"
        >
          <LogIn className="w-4 h-4" />
          Log In
        </Link>
        <Link
          href="/register?redirect=/societies/canva/apply"
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-accent-500/40 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20 font-semibold text-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Sign Up
        </Link>
      </div>

      <p className="text-dark-500 text-xs mt-6">
        Already have an account?{" "}
        <Link href="/login?redirect=/societies/canva/apply" className="text-accent-400 hover:text-accent-300 font-medium">
          Sign in here
        </Link>
      </p>
    </div>
  );
}

// ─── Main Modal Component ────────────────────────────────────────────────────
export function CanvaCTAModal({ isLoggedIn, userId, alreadyApplied }: CanvaCTAModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ── CTA Banner ── */}
      <div className="mb-8 relative overflow-hidden glass rounded-3xl p-6 border border-accent-500/25 bg-gradient-to-br from-accent-900/30 via-dark-900 to-purple-900/20">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-500/15 border border-accent-500/20 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-accent-400" />
                <span className="text-xs font-semibold text-accent-300 uppercase tracking-wide">Featured Opportunity</span>
              </div>
              <span className="px-2 py-0.5 bg-green-500/15 border border-green-500/20 rounded-full text-xs font-semibold text-green-400">Open</span>
            </div>

            <h2 className="text-2xl font-display font-bold text-white leading-tight mb-2">
              Canva Student Community{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-purple-400">
                Executive Team
              </span>{" "}
              Applications
            </h2>
            <p className="text-dark-100 text-sm max-w-lg leading-relaxed">
              Join the founding team at Air University Islamabad and help build one of the campus&apos;s most creative communities. Shape the future of design culture on campus.
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {["Events Team", "Graphic Design", "Social Media", "Content Writing"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-dark-800/60 border border-dark-700 rounded-lg text-xs text-dark-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            id="canva-apply-btn"
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-2xl hover:from-accent-400 hover:to-accent-500 transition-all shadow-xl shadow-accent-500/30 hover:shadow-accent-500/50 hover:-translate-y-0.5 whitespace-nowrap group"
          >
            <Palette className="w-4 h-4" />
            Apply Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ── Modal Overlay ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(3, 3, 3, 0.85)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col bg-dark-950 sm:rounded-3xl border border-dark-700/80 shadow-2xl shadow-black/60 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500/20 to-purple-500/20 border border-accent-500/30 flex items-center justify-center">
                  <Palette className="w-4.5 h-4.5 text-accent-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm leading-tight">Canva Student Community</h2>
                  <p className="text-dark-400 text-xs">Air University Islamabad · Executive Team</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-dark-800 hover:bg-dark-700 flex items-center justify-center text-dark-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col flex-1 min-h-0">
              {alreadyApplied ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-center px-6">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Application Already Submitted</h3>
                  <p className="text-dark-100 text-sm max-w-xs">
                    You&apos;ve already applied to the Canva Student Community. We&apos;ll get back to you soon!
                  </p>
                </div>
              ) : !isLoggedIn ? (
                <AuthGate />
              ) : (
                <ApplicationForm userId={userId!} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
