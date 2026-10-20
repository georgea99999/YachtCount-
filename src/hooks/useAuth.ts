import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { crewEmail } from '@/lib/crew';

const KEEP_FLAG = 'yc_keep_logged_in';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // If the user didn't opt to stay logged in, force sign-out on every fresh load
    // so the password screen always appears.
    const keep = localStorage.getItem(KEEP_FLAG) === 'true';
    if (!keep) {
      supabase.auth.signOut().finally(() => {
        setSession(null);
        setLoading(false);
      });
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string, keepLoggedIn: boolean) => {
    let email: string;
    try { email = crewEmail(username); } catch { return {error:'Enter your crew username'}; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return {error:'Invalid username or vessel password'};
    if (keepLoggedIn) localStorage.setItem(KEEP_FLAG, 'true');
    else localStorage.removeItem(KEEP_FLAG);

    return { error: null };
  };

  const logout = async () => {
    localStorage.removeItem(KEEP_FLAG);
    await supabase.auth.signOut();
  };

  return { session, loading, login, logout };
}
