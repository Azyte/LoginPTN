import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  
  // Try to get forwarded host first (for Vercel), fallback to request host
  let origin = request.headers.get("origin") || request.headers.get("x-forwarded-host") || requestUrl.host;
  
  // Format origin properly
  if (!origin.startsWith("http")) {
    origin = `${requestUrl.protocol}//${origin}`;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
