import React, { createContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

export const AuthContext = createContext(null);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing!');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          setUser(session.user);
          // Fetch profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        setUser(session.user);

        // Fetch profile when user logs in
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email, password, displayName) => {
      try {
        setError(null);
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: displayName,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Create profile
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: data.user.id,
              display_name: displayName || 'User',
              avatar_url: null,
              bio: null,
            },
          ]);

          if (profileError) console.error('Profile creation error:', profileError);
        }

        return { user: data.user, error: null };
      } catch (err) {
        setError(err.message);
        return { user: null, error: err };
      }
    },
    []
  );

  const signIn = useCallback(async (email, password) => {
    try {
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      setSession(data.session);
      setUser(data.user);

      return { user: data.user, error: null };
    } catch (err) {
      setError(err.message);
      return { user: null, error: err };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const updateProfile = useCallback(
    async (displayName, avatarUrl, bio) => {
      try {
        setError(null);
        if (!user) throw new Error('No user logged in');

        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            avatar_url: avatarUrl,
            bio: bio,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setProfile(data);
        return { profile: data, error: null };
      } catch (err) {
        setError(err.message);
        return { profile: null, error: err };
      }
    },
    [user]
  );

  const getAuthToken = useCallback(async () => {
    if (session) {
      return session.access_token;
    }
    return null;
  }, [session]);

  const value = {
    user,
    profile,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    getAuthToken,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
