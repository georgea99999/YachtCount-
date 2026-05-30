import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session } from '@supabase/supabase-js';

const SHARED_EMAIL = 'oktodeck@yachtcount.app';
const SHARED_PASSWORD = 'Okto26';
const SHARED_USERNAME = 'Oktodeck';
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
    if (username !== SHARED_USERNAME || password !== SHARED_PASSWORD) {
      return { error: 'Invalid username or password' };
    }

    if (keepLoggedIn) {
      localStorage.setItem(KEEP_FLAG, 'true');
    } else {
      localStorage.removeItem(KEEP_FLAG);
    }

    // Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: SHARED_EMAIL,
      password: SHARED_PASSWORD,
    });

    if (signInError) {
      // If user doesn't exist, sign up
      if (signInError.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: SHARED_EMAIL,
          password: SHARED_PASSWORD,
        });
        if (signUpError) return { error: signUpError.message };

        // Sign in after signup
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: SHARED_EMAIL,
          password: SHARED_PASSWORD,
        });
        if (retryError) return { error: retryError.message };
      } else {
        return { error: signInError.message };
      }
    }

    return { error: null };
  };

  const logout = async () => {
    localStorage.removeItem(KEEP_FLAG);
    await supabase.auth.signOut();
  };

  return { session, loading, login, logout };
}
