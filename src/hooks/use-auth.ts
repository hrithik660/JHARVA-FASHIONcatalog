import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

async function fetchIsAdmin(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  return !!data;
}

function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 5000) {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), ms)),
  ]);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = async (nextUser: User | null) => {
      setLoading(true);
      setUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const nextIsAdmin = await withTimeout(fetchIsAdmin(nextUser.id), false);
        if (!active) return;
        setIsAdmin(nextIsAdmin);
      } finally {
        if (active) setLoading(false);
      }
    };

    // Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer role fetch off the auth callback
      setTimeout(() => applySession(session?.user ?? null), 0);
    });

    withTimeout(supabase.auth.getSession(), { data: { session: null }, error: null }).then(
      ({ data }) => {
        applySession(data.session?.user ?? null);
      },
    );

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isAdmin,
    loading,
    signOut: () => supabase.auth.signOut(),
  };
}
