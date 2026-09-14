import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { NewTransaction } from "@/lib/types";

/** "2026-09" -> ["2026-09-01", "2026-10-01"] (exclusive end). */
function monthRange(month: string): [string, string] {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 1));
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let query = supabase
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });

  const month = new URL(request.url).searchParams.get("month");
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [start, end] = monthRange(month);
    query = query.gte("occurred_on", start).lt("occurred_on", end);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as NewTransaction;
  if (
    !body.occurred_on ||
    body.amount == null ||
    !body.category ||
    (body.type !== "expense" && body.type !== "income")
  ) {
    return NextResponse.json(
      { error: "type, occurred_on, amount and category are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      type: body.type,
      occurred_on: body.occurred_on,
      amount: body.amount,
      category: body.category,
      note: body.note ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
