import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Prevent duplicates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from("canva_applications")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already applied" }, { status: 409 });
    }

    // Validate required fields
    const required = [
      "full_name",
      "university_email",
      "phone_number",
      "department",
      "current_semester",
      "campus",
      "volunteered",
      "member_of_org",
      "used_canva",
      "roles",
      "experience",
      "motivation_why",
      "motivation_skills",
      "motivation_goals",
      "agreement",
    ];

    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === "") {
        return NextResponse.json({ error: `Missing field ${key}` }, { status: 400 });
      }
    }

    // Insert
    const insertPayload = {
      user_id: user.id,
      full_name: body.full_name,
      university_email: body.university_email,
      phone_number: body.phone_number,
      department: body.department,
      current_semester: body.current_semester,
      campus: body.campus,
      volunteered: body.volunteered,
      member_of_org: body.member_of_org,
      org_names: body.org_names || null,
      used_canva: body.used_canva,
      roles: body.roles,
      first_preference: body.first_preference || null,
      experience: body.experience,
      linkedin: body.linkedin || null,
      motivation_why: body.motivation_why,
      motivation_skills: body.motivation_skills,
      motivation_goals: body.motivation_goals,
      agreement: body.agreement,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("canva_applications").insert(insertPayload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
