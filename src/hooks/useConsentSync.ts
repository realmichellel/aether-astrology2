import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { syncEmailPreferences } from "@/lib/consent.functions";

const LOCAL_KEY = "aether_signup_consent";

/**
 * Persists the signup consent (terms + optional promotional emails) into the
 * database the first time a user reaches the app. Email signups carry it in
 * auth metadata; Google signups stash it in localStorage before the redirect.
 */
export function useConsentSync() {
  const sync = useServerFn(syncEmailPreferences);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;

      const meta = (data.user.user_metadata ?? {}) as {
        marketing_opt_in?: boolean;
        terms_accepted_at?: string;
      };

      let local: { marketing_opt_in?: boolean; terms_accepted_at?: string } = {};
      try {
        const raw = window.localStorage.getItem(LOCAL_KEY);
        if (raw) local = JSON.parse(raw);
      } catch {
        /* storage unavailable */
      }

      try {
        await sync({
          data: {
            marketing_opt_in: Boolean(meta.marketing_opt_in ?? local.marketing_opt_in ?? false),
            terms_accepted_at: meta.terms_accepted_at ?? local.terms_accepted_at ?? null,
          },
        });
        window.localStorage.removeItem(LOCAL_KEY);
      } catch {
        /* consent recording is best-effort; never block the app */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sync]);
}
