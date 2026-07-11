"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
};

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

export default function CanvaApplicationForm({ userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const vErr = validate();
    if (vErr) {
      setError(vErr);
      return;
    }
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
        // Not authenticated
        window.location.href = `/login?redirect=/societies/canva/apply`;
        return;
      }

      if (res.status === 409) {
        setError("You have already submitted an application.");
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error || "Failed to submit application");
        return;
      }

      setSuccess(true);
      // Optionally navigate or refresh
      setTimeout(() => router.refresh(), 800);
    } catch (err: any) {
      setError(err?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="glass-light rounded-3xl p-8 text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-3">Your application has been submitted successfully.</h2>
        <p className="text-dark-200">Thank you for applying to the Canva Student Community at Air University!</p>
      </div>
    );
  }

  return (
    <form className="glass-light rounded-3xl p-8 space-y-6" onSubmit={handleSubmit}>
      {error && <div className="text-sm text-red-400">{error}</div>}

      <section>
        <h3 className="font-semibold text-white mb-2">🎨 Welcome to the Canva Student Community at Air University Islamabad!</h3>
        <p className="text-dark-200 text-sm">We're looking for passionate, creative, and motivated students to join our Founding Team and help build one of Air University's most exciting student communities.</p>
      </section>

      <div>
        <label className="block text-sm text-dark-100 mb-1">Full Name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full" />
      </div>

      <div>
        <label className="block text-sm text-dark-100 mb-1">University Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full" />
      </div>

      <div>
        <label className="block text-sm text-dark-100 mb-1">Phone Number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full" />
      </div>

      <div>
        <label className="block text-sm text-dark-100 mb-1">Department</label>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full">
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {department === "Other" && (
          <input placeholder="Please specify" value={otherDepartment} onChange={(e) => setOtherDepartment(e.target.value)} className="w-full mt-2" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-dark-100 mb-1">Current Semester</label>
          <input value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="block text-sm text-dark-100 mb-1">Campus</label>
          <select value={campus} onChange={(e) => setCampus(e.target.value)} className="w-full">
            {CAMPUSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <hr />

      <div>
        <h4 className="font-semibold text-white mb-2">About You ✨</h4>
        <div>
          <div className="mb-2">Have you ever volunteered in a university event?</div>
          <label><input type="radio" name="volunteered" value="yes" onChange={() => setVolunteered("yes")} /> Yes</label>
          <label className="ml-4"><input type="radio" name="volunteered" value="no" onChange={() => setVolunteered("no")} /> No</label>
        </div>

        <div className="mt-3">
          <div className="mb-2">Are you currently a member of any university society or organization?</div>
          <label><input type="radio" name="memberOfOrg" value="yes" onChange={() => setMemberOfOrg("yes")} /> Yes</label>
          <label className="ml-4"><input type="radio" name="memberOfOrg" value="no" onChange={() => setMemberOfOrg("no")} /> No</label>
        </div>

        <div className="mt-3">
          <label className="block text-sm text-dark-100 mb-1">If yes, please mention the name(s) of the society/organization. (Optional)</label>
          <input value={orgNames} onChange={(e) => setOrgNames(e.target.value)} className="w-full" />
        </div>

        <div className="mt-3">
          <label className="block text-sm text-dark-100 mb-1">Have you ever used Canva?</label>
          <select value={usedCanva} onChange={(e) => setUsedCanva(e.target.value)} className="w-full">
            <option value="">Select</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Never Used</option>
          </select>
        </div>
      </div>

      <hr />

      <div>
        <h4 className="font-semibold text-white mb-2">Roles ✨</h4>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <label key={r} className="flex items-center gap-2">
              <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} /> {r}
            </label>
          ))}
        </div>

        <div className="mt-3">
          <label className="block text-sm text-dark-100 mb-1">Which ONE role would be your first preference? (Optional)</label>
          <select value={firstPreference} onChange={(e) => setFirstPreference(e.target.value)} className="w-full">
            <option value="">No preference</option>
            {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>

        <div className="mt-3">
          <label className="block text-sm text-dark-100 mb-1">Tell us about any experience you have.</label>
          <textarea value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full" rows={4} />
        </div>

        <div className="mt-3">
          <label className="block text-sm text-dark-100 mb-1">Share link to your LinkedIn</label>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className="w-full" />
        </div>
      </div>

      <hr />

      <div>
        <h4 className="font-semibold text-white mb-2">Motivation ✨</h4>
        <div className="text-sm text-amber-300 mb-2">Please don't use AI for writing these answers!!!</div>

        <div className="mt-2">
          <label className="block text-sm text-dark-100 mb-1">Why do you want to join the Canva Student Community at Air University?</label>
          <textarea value={whyJoin} onChange={(e) => setWhyJoin(e.target.value)} className="w-full" rows={4} />
        </div>

        <div className="mt-2">
          <label className="block text-sm text-dark-100 mb-1">What unique skills or qualities will you bring to the team?</label>
          <textarea value={skills} onChange={(e) => setSkills(e.target.value)} className="w-full" rows={4} />
        </div>

        <div className="mt-2">
          <label className="block text-sm text-dark-100 mb-1">If selected, what would you like to achieve during your time as a volunteer?</label>
          <textarea value={goals} onChange={(e) => setGoals(e.target.value)} className="w-full" rows={4} />
        </div>
      </div>

      <hr />

      <div>
        <h4 className="font-semibold text-white mb-2">Agreement ✨</h4>
        <div className="mb-2">I understand that:</div>
        <ul className="text-dark-200 list-disc ml-5 mb-3">
          <li>I am applying to become a volunteer for the Canva Student Community at Air University Islamabad.</li>
          <li>This is not employment, an internship, or an official staff position at Canva.</li>
          <li>Volunteer responsibilities include attending meetings, supporting events, and completing assigned tasks.</li>
          <li>I will communicate professionally and respectfully with fellow volunteers.</li>
          <li>I will contribute actively to the growth of the student community.</li>
        </ul>

        <label className="mr-4"><input type="radio" name="agreement" value="agree" onChange={() => setAgreement("agree")} /> I agree</label>
        <label><input type="radio" name="agreement" value="disagree" onChange={() => setAgreement("disagree")} /> I disagree</label>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="px-6 py-2 bg-accent-500 text-white rounded-xl">
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}
