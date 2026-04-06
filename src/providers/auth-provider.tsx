"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
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

  const fetchProfile = async (userId: string, authUser?: User | null) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        // Auto-repair empty profile name from auth metadata or email
        if (!data.name || data.name.trim() === "") {
          const currentUser = authUser || (await supabase.auth.getUser()).data.user;
          const fallbackName =
            currentUser?.user_metadata?.name ||
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split("@")[0] ||
            "Pejuang PTN";

          // Update in DB so it persists
          await supabase
            .from("profiles")
            .update({ name: fallbackName })
            .eq("id", userId);

          data.name = fallbackName;
        }
      }

      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: if auth takes more than 8 seconds, stop loading to prevent infinite spinner
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn("Auth loading timeout — forcing load complete");
        setLoading(false);
      }
    }, 8000);

    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUser(authUser);
        if (authUser) {
          await fetchProfile(authUser.id, authUser);
        }
      } catch (err) {
        console.error("Error getting user:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
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
