"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function normalizeOrigin(value: string) {
  return value.replace(/\/+$/, "");
}

function getAppOrigin(headerStore: Headers) {
  const requestOrigin = headerStore.get("origin");

  if (requestOrigin) {
    return normalizeOrigin(requestOrigin);
  }

  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");

  if (host) {
    const forwardedProto = headerStore.get("x-forwarded-proto");
    const proto = forwardedProto?.split(",")[0] ?? (host.includes("localhost") ? "http" : "https");

    return `${proto}://${host.split(",")[0]}`;
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function signInWithGoogle() {
  const headerStore = await headers();
  const origin = getAppOrigin(headerStore);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}
