/**
 * Supabase wiring for the Runway storefront.
 *
 * Env (put these in .env.local — VITE_ vars are baked into the Cloudflare
 * Pages build, so also set them in the Pages project settings):
 *   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
 *   VITE_SUPABASE_ANON_KEY=...   (the new sb_publishable_… keys work too)
 *
 * The anon key is safe in the browser: every table is locked down by RLS
 * (see supabase/schema.sql) — public reads for the storefront, writes only
 * through the service-role admin-auth edge function / upload script.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseEnv {
    url: string;
    anonKey: string;
    configured: boolean;
}

export function getSupabaseEnv(): SupabaseEnv {
    const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
    return { url, anonKey, configured: Boolean(url && anonKey) };
}

let client: SupabaseClient | null = null;

/** Lazy singleton; null when the env vars are missing (app still runs local-only). */
export function getSupabase(): SupabaseClient | null {
    const { url, anonKey, configured } = getSupabaseEnv();
    if (!configured) return null;
    if (!client) {
        client = createClient(url, anonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return client;
}

export interface AdminAuthResponse {
    status: number;
    data: Record<string, unknown>;
}

/**
 * Call the admin-auth edge function (deployed with --no-verify-jwt, so the
 * anon key rides the apikey header). CORS is open on the function itself.
 */
export async function callAdminAuth(
    body: Record<string, unknown>,
    bearerToken?: string,
): Promise<AdminAuthResponse> {
    const { url, anonKey, configured } = getSupabaseEnv();
    if (!configured) {
        return {
            status: 0,
            data: { error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.' },
        };
    }
    try {
        const res = await fetch(`${url}/functions/v1/admin-auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: anonKey,
                ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
            },
            body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return { status: res.status, data };
    } catch (err) {
        console.error('[admin-auth] network failure:', err);
        return { status: 0, data: { error: 'Could not reach the auth service. Is the edge function deployed?' } };
    }
}
