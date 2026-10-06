import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'provider' | 'customer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: AppRole, profileData?: ProviderProfileData) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signUpProviderWithPhone: (phone: string, password: string, profileData: ProviderProfileData) => Promise<{ error: Error | null; otp?: string }>;
  verifyProviderOtp: (phone: string, otp: string, password: string, profileData: ProviderProfileData) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

interface ProviderProfileData {
  full_name: string;
  phone: string;
  skills?: string[];
  address?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  /**
   * Resolve the user's role with a 4-second timeout.
   * Priority:
   *  1. user_metadata.role   (in the JWT — zero network cost, instant)
   *  2. user_roles DB table  (fallback for accounts created outside the app)
   *  3. 'customer'           (safe default)
   */
  const resolveRole = async (session: Session): Promise<AppRole> => {
    // ── Fast path: role is embedded in the JWT user_metadata (set at signUp) ──
    const metaRole = session.user.user_metadata?.role as string | undefined;
    if (metaRole === 'admin' || metaRole === 'provider' || metaRole === 'customer') {
      return metaRole; // instant — no DB query needed
    }

    // ── Slow path: user created externally, check DB (with 3s timeout) ────────
    try {
      const dbQuery = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
      const result = await Promise.race([dbQuery, timeout]);

      if (result && 'data' in result && result.data?.role) {
        return result.data.role as AppRole;
      }
    } catch { /* ignore */ }

    return 'customer';
  };

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (cancelled) return;

        // ── No user ────────────────────────────────────────────────────────────
        if (!currentSession?.user) {
          setSession(null);
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        // ── TOKEN_REFRESHED — just sync session, don't touch role/loading ──────
        if (event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession.user);
          return;
        }

        // ── INITIAL_SESSION — check "remember me" preference for providers ──────
        // If the provider did NOT tick "remember me", we sign them out on new page load.
        if (event === 'INITIAL_SESSION') {
          const noRemember = sessionStorage.getItem('provider_remember_me') === 'false';
          if (noRemember) {
            sessionStorage.removeItem('provider_remember_me');
            await supabase.auth.signOut();
            setSession(null); setUser(null); setRole(null); setLoading(false);
            return;
          }
        }

        // ── INITIAL_SESSION or SIGNED_IN — resolve role ────────────────────────
        setLoading(true);
        setSession(currentSession);
        setUser(currentSession.user);

        const resolvedRole = await resolveRole(currentSession);

        if (!cancelled) {
          setRole(resolvedRole);
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);



  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  // ── Provider Phone Auth (WhatsApp OTP Method) ────────────────────────────────
  // No Twilio or paid SMS needed. We generate an OTP, store it in Supabase,
  // and open a WhatsApp link pre-filled with "Your OTP is XXXXXX" so the provider
  // reads the code and enters it. After one-time verification, login is just
  // phone + password (no OTP again).

  // Internal: converts phone to a hidden email so Supabase auth works without
  // native phone provider enabled.
  const phoneToEmail = (phone: string) =>
    `91${phone.replace(/\D/g, '').slice(-10)}@ nearmitra.provider`;

  /**
   * SIGNUP STEP 1 — Generate OTP, store in DB, return it.
   * The component uses the returned OTP to open a WhatsApp link like:
   *   https://wa.me/91XXXXXXXXXX?text=Your  NearMitra OTP is: 482193
   */
  const signUpProviderWithPhone = async (
    phone: string,
    _password: string,   // not used here; passed at verify step
    _profileData: ProviderProfileData,
  ): Promise<{ error: Error | null; otp?: string }> => {
    // Clear any stale session
    await supabase.auth.signOut();

    const normalised = `91${phone.replace(/\D/g, '').slice(-10)}`;

    // Delete any old OTPs for this phone so only the latest is valid
    await supabase.from('phone_otps').delete().eq('phone', normalised);

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store in DB with 10-minute expiry
    const { error: insertError } = await supabase.from('phone_otps').insert({
      phone: normalised,
      otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (insertError) return { error: insertError as Error };

    return { error: null, otp };
  };

  /**
   * SIGNUP STEP 2 — Verify OTP from DB, then create provider account.
   * After this succeeds, the provider's account exists and they can log in
   * with just phone + password — no OTP ever again.
   */
  const verifyProviderOtp = async (
    phone: string,
    otp: string,
    password: string,
    profileData: ProviderProfileData,
  ) => {
    const normalised = `91${phone.replace(/\D/g, '').slice(-10)}`;

    // 1. Look up OTP in DB
    const { data: otpRow, error: fetchError } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', normalised)
      .eq('otp', otp.replace(/\D/g, ''))
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) return { error: fetchError as Error };
    if (!otpRow) return { error: new Error('Invalid or expired OTP. Please try again.') };

    // 2. Mark OTP as used
    await supabase.from('phone_otps').update({ verified: true }).eq('id', otpRow.id);

    // 3. Create Supabase auth account.
    //    The DB trigger (create_provider_profile_after_signup) auto-creates provider_profiles
    //    using SECURITY DEFINER — bypasses RLS entirely.
    const email = phoneToEmail(phone);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'provider',
          full_name: profileData.full_name,
          phone: profileData.phone,
          skills: profileData.skills,
          address: profileData.address,
        },
      },
    });
    if (signUpError) return { error: signUpError as Error };

    const userId = signUpData.user?.id;
    if (!userId) return { error: new Error('Account created but no user ID returned') };

    // 4. Sign in immediately so we have a session for upsert calls below
    await supabase.auth.signInWithPassword({ email, password });

    // 5. Ensure user_roles row exists (trigger should have done this; belt-and-suspenders)
    await supabase.from('user_roles')
      .upsert({ user_id: userId, role: 'provider' })
      .then(({ error }) => { if (error) console.warn('user_roles upsert:', error.message); });

    // 6. Fallback profile insert — FULLY NON-FATAL.
    //    If the DB trigger ran correctly, the profile already exists (ON CONFLICT DO NOTHING).
    //    If RLS blocks this, we just log it — the dashboard shows a graceful "pending" screen.
    const { data: existingProfile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await supabase.from('provider_profiles').insert({
        user_id: userId,
        full_name: profileData.full_name,
        phone: profileData.phone,
        address: profileData.address ?? '',
        skills: profileData.skills ?? [],
        is_available: true,
        is_approved: true,
      });
      if (profileError) {
        // Non-fatal: Supabase trigger should have created the profile.
        // If not, admin can fix it manually. Auth account is valid.
        console.warn('Fallback profile insert skipped (expected if trigger ran):', profileError.message);
      }
    }

    // Provider remains logged in with the session established in step 4
    return { error: null };
  };

  /**
   * LOGIN — Phone + Password. No OTP needed after the first-time setup.
   * Uses the hidden phone-derived email internally; user only types their number.
   */
  const signInWithPhone = async (phone: string, password: string) => {
    const email = phoneToEmail(phone);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error };

    // Repair role if somehow stale
    if (data.user?.user_metadata?.role !== 'provider') {
      await supabase.auth.updateUser({ data: { role: 'provider' } });
      if (data.user?.id) {
        await supabase.from('user_roles').upsert({ user_id: data.user.id, role: 'provider' });
      }
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    userRole: AppRole,
    profileData?: ProviderProfileData,
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          // Stored in user_metadata — used as fallback if user_roles row is missing
          role: userRole,
          full_name: profileData?.full_name,
          phone: profileData?.phone,
          skills: profileData?.skills,
          address: profileData?.address,
        },
      },
    });
    if (error) return { error: error as Error };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // SIGNED_OUT event will clear state via onAuthStateChange
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, role,
      signIn, signUp,
      signInWithPhone, signUpProviderWithPhone, verifyProviderOtp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
