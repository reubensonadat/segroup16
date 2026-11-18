/**
 * Admin auth for the Runway dashboard — Kola's phone-OTP flow, ported.
 *
 * One module-level store, two consumers:
 *   · React      → <AuthProvider> / useAuth()   (the login screen)
 *   · router.ts  → isAdminAuthed()              (the #admin gate)
 *
 * The OTP itself lives server-side in the `admin-auth` Supabase edge function
 * (hashed codes in public.otp_codes, sessions in public.admin_sessions).
 * This module just talks to it and caches the issued token.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { callAdminAuth } from './lib/supabase';

export interface AdminInfo {
    phone: string;
    name: string;
    role: string;
}

interface StoredSession {
    token: string;
    admin: AdminInfo;
    expiresAt: number; // wall-clock ms, matches the 12h server session
}

const SESSION_KEY = 'runway-admin-session-v1';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

// ── Module-level store ─────────────────────────────────────────────────────
let current: StoredSession | null = loadSession();
const listeners = new Set<() => void>();

function loadSession(): StoredSession | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredSession;
        if (!parsed?.token || !parsed?.admin || parsed.expiresAt <= Date.now()) return null;
        return parsed;
    } catch {
        return null;
    }
}

function persist(next: StoredSession | null): void {
    current = next;
    try {
        if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
        else localStorage.removeItem(SESSION_KEY);
    } catch { /* private mode — in-memory session still works */ }
    listeners.forEach((fn) => fn());
}

export function getAdminSession(): StoredSession | null {
    return current && current.expiresAt > Date.now() ? current : null;
}

export function isAdminAuthed(): boolean {
    return getAdminSession() !== null;
}

export function subscribeAdminAuth(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** Re-validate the cached token against the server (boot-time, best effort). */
async function validateSession(): Promise<void> {
    const session = getAdminSession();
    if (!session) return;
    const { status } = await callAdminAuth({ action: 'session' }, session.token);
    if (status === 401 || status === 403) persist(null);
}

// ── Edge-function calls ────────────────────────────────────────────────────
export interface SendOtpResult {
    error?: string;
    /** Demo mode (no MNOTIFY_API_KEY on the function): the code comes back inline. */
    demoCode?: string;
}

export async function sendAdminOtp(phone: string): Promise<SendOtpResult> {
    const { status, data } = await callAdminAuth({ action: 'send_otp', phone });
    const error = typeof data.error === 'string' ? data.error : undefined;
    if (error) return { error };
    if (status >= 400) return { error: 'Could not send the code. Try again.' };
    return {
        demoCode: typeof data.code === 'string' && data.demo === true ? data.code : undefined,
    };
}

export async function verifyAdminOtp(phone: string, code: string): Promise<{ error?: string }> {
    const { status, data } = await callAdminAuth({ action: 'verify_otp', phone, code });
    const error = typeof data.error === 'string' ? data.error : undefined;
    if (error) return { error };
    const token = typeof data.token === 'string' ? data.token : null;
    const admin = data.admin as AdminInfo | undefined;
    if (status >= 400 || !token || !admin) return { error: 'Sign-in failed. Try again.' };
    persist({ token, admin, expiresAt: Date.now() + SESSION_TTL_MS });
    return {};
}

export async function logoutAdmin(): Promise<void> {
    const session = getAdminSession();
    if (session) {
        void callAdminAuth({ action: 'logout' }, session.token).catch(() => { });
    }
    persist(null);
    if (window.location.hash.toLowerCase().startsWith('#admin')) {
        window.location.hash = '#home';
    }
}

// ── React bridge ───────────────────────────────────────────────────────────
export interface AuthContextValue {
    admin: AdminInfo | null;
    isAuthed: boolean;
    isInitializing: boolean;
    sendOtp: typeof sendAdminOtp;
    verifyOtp: typeof verifyAdminOtp;
    logout: typeof logoutAdmin;
}

const AuthContext = createContext<AuthContextValue>({
    admin: null,
    isAuthed: false,
    isInitializing: true,
    sendOtp: sendAdminOtp,
    verifyOtp: verifyAdminOtp,
    logout: logoutAdmin,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [, forceRender] = useState(0);

    useEffect(() => {
        const unsubscribe = subscribeAdminAuth(() => forceRender((n) => n + 1));
        void validateSession();
        return unsubscribe;
    }, []);

    const session = getAdminSession();
    const value: AuthContextValue = {
        admin: session?.admin ?? null,
        isAuthed: session !== null,
        isInitializing: false,
        sendOtp: sendAdminOtp,
        verifyOtp: verifyAdminOtp,
        logout: logoutAdmin,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    return useContext(AuthContext);
}

/** Ghana phone normalization (client twin of the edge function's rule). */
export function normalizeGhPhone(input: string): string | null {
    if (!input) return null;
    const digits = input.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const m = digits.match(/^(?:00)?(?:233)?0*([235]\d{8})$/);
    return m ? '233' + m[1] : null;
}

/** "233541651298" → "054 165 1298" for display. */
export function formatGhPhoneDisplay(normalized: string): string {
    const local = normalized.startsWith('233') ? '0' + normalized.slice(3) : normalized;
    const m = local.match(/^0(\d{3})(\d{3})(\d{3})$/);
    return m ? `0${m[1]} ${m[2]} ${m[3]}` : local;
}
