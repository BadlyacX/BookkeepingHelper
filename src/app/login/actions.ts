"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

/**
 * Redirect back to /login carrying an error message and the email the
 * user typed, so the email field stays filled in. The password is
 * intentionally NOT round-tripped through the URL (query strings end
 * up in server logs / browser history) — the user just retypes it.
 */
function redirectWithError(email: string, message: string): never {
  const params = new URLSearchParams({ error: message, email });
  redirect(`/login?${params.toString()}`);
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData);

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirectWithError(email, error.message);
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const { email, password } = readCredentials(formData);

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirectWithError(email, error.message);
  }

  // Supabase doesn't return an error for a duplicate signup (to avoid
  // leaking which emails are registered) — instead the returned user
  // has an empty `identities` array. That's the documented signal for
  // "this email is already registered".
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    redirectWithError(email, "此 Email 已經註冊過了,請直接登入。");
  }

  redirect("/login?notice=" + encodeURIComponent("註冊成功,請至信箱收信並完成驗證後再登入。"));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
