import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserProfile } from '@/types';
import { AuthContext, type AuthContextValue } from './AuthContext';

/**
 * AuthProvider — wires Supabase email/password auth into React context.
 *
 * The hook is auth-library agnostic from the consumer's perspective: it
 * exposes `user`, `profile`, `signIn`, `signUp`, `signOut`, `updateProfile`,
 * and `loading`. Swapping the backend later only changes this file.
 *
 * Email confirmation stays off (per project convention), so signUp yields
 * a usable session immediately.
 */

interface AuthProviderProps {
  children: React.ReactNode;
}

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as UserProfile['role'],
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap: read the current session, then subscribe to changes.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    // onAuthStateChange fires for SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load the profile row whenever the user changes.
  const user: User | null = session?.user ?? null;

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let active = true;

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) setProfile(mapProfile(data as unknown as ProfileRow));
      });

    return () => {
      active = false;
    };
  }, [user]);

  const signUp = useCallback(
    async (email: string, password: string, firstName?: string, lastName?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName ?? '', last_name: lastName ?? '' } },
      });
      if (error) throw error;

      // The trigger creates a bare profile row; update names if we have a session.
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ first_name: firstName ?? null, last_name: lastName ?? null })
          .eq('id', data.user.id);
      }
    },
    [],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'avatarUrl'>>) => {
      if (!user) throw new Error('Not signed in');
      const row: Record<string, unknown> = {};
      if (updates.firstName !== undefined) row.first_name = updates.firstName;
      if (updates.lastName !== undefined) row.last_name = updates.lastName;
      if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;

      const { error } = await supabase.from('profiles').update(row as never).eq('id', user.id);
      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      session,
      loading,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signOut,
      updateProfile,
    }),
    [user, profile, session, loading, signIn, signUp, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
