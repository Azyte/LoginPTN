"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Build a fallback profile from the auth User object so the UI never shows "User"
  const buildFallbackProfile = useCallback((authUser: User): Profile => ({
    id: authUser.id,
    name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Pengguna",
    email: authUser.email || "",
    avatar_url: null,
    role: "student" as const,
    bio: null,
    school: null,
    target_university_id: null,
    target_major_id: null,
    language_preference: "id",
    theme_preference: "dark",
    study_goal: null,
    daily_target_minutes: 60,
    created_at: new Date().toISOString(),
  }), []);

  const fetchProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (data) {
        // If the name stored in DB is empty, patch it with email prefix
        if (!data.name || data.name.trim() === "") {
          const emailName = authUser.email?.split("@")[0] || "Pengguna";
          data.name = emailName;
          // Fire-and-forget update so it sticks for next time
          supabase.from("profiles").update({ name: emailName }).eq("id", authUser.id).then(() => {});
        }
        setProfile(data);
      } else {
        console.warn("Profile fetch issue:", error?.message);
        setProfile(buildFallbackProfile(authUser));
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfile(buildFallbackProfile(authUser));
    }
  }, [supabase, buildFallbackProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth loading timeout — forcing load complete");
        setLoading(false);
      }
    }, 8000);

    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUser(authUser);
        if (authUser) {
          await fetchProfile(authUser);
        }
      } catch (err) {
        console.error("Error getting user:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
