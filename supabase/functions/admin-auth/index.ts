// =============================================================================
// admin-auth — phone-OTP login for the Runway admin dashboard
// (ported from Kola's staff-auth, simplified to a single admin seat)
//
// SINGLE SELF-CONTAINED FILE — paste this whole file into the Supabase
// Dashboard Edge Functions editor. The dashboard bundles ONE file and cannot
// resolve "../_shared/..." imports, which is why the mNotify client lives
// inline below instead of in a shared module.
//
// Flow:
//   1. send_otp   { phone }        → 6-digit code, SHA-256 hashed into
//                                    public.otp_codes (single-live-per-phone,
//                                    10-min expiry, max 5 attempts, 45s
//                                    resend cooldown). Delivered by mNotify.
//                                    If MNOTIFY_API_KEY is not set, DEMO MODE
//                                    returns the code in the response so the
//                                    demo can log in without SMS credits.
//   2. verify_otp { phone, code }  → consumes the code, opens a row in
//                                    public.admin_sessions (uuid token, 12h)
//                                    and returns { token, admin }.
//   3. session    (Bearer token)   → validates the token, returns { admin }.
//   4. logout     (Bearer token)   → deletes the session row.
//   5. push_data  (Bearer token)   → upserts products/looks/orders/settings
//                                    (the dashboard "PUSH DATA" button).
//
// Only phones seeded in public.admin_users can receive codes — the demo admin
// is 0541651298 (stored as 233541651298, seeded by supabase/schema.sql).
//
// Deploy via the Supabase DASHBOARD:
//   Edge Functions → New function → name `admin-auth` → paste this file →
//   Deploy. IMPORTANT: turn OFF "Verify JWT" (the OTP session token is a
//   plain uuid, not a JWT). Add MNOTIFY_API_KEY on the function's Secrets
//   panel only if you want real SMS — leave unset for demo mode.
// =============================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── mNotify SMS client (inlined from _shared/mnotify.ts) ────────────────────
// The API key NEVER leaves the server. Get one at mnotify.com (Ghana).

const MNOTIFY_API_KEY = Deno.env.get('MNOTIFY_API_KEY') ?? '';
const MNOTIFY_ENDPOINT = 'https://api.mnotify.com/api/sms/quick';

/** LOCKED OTP SENDER — hardcoded to `Kola` (registered OTP-type at mNotify).
 * No env override, no caller override — every auth code texts from Kola. */
const OTP_SENDER_ID = 'Kola';

interface SmsResult {
    ok: boolean;
    error?: string;
}

/** True when SMS is wired — callers use this to pick real-SMS vs demo mode. */
function smsConfigured(): boolean {
    return MNOTIFY_API_KEY.length > 0;
}

/**
 * Normalize a Ghana phone number to 233XXXXXXXXX. Accepts every entry habit:
 * 0244…, +233…, 233…, 00233…, and stacked combos, whitespace stripped first.
 */
function normalizePhone(input: string): string | null {
    if (!input) return null;
    const digits = String(input).replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const m = digits.match(/^(?:00)?(?:233)?0*([235]\d{8})$/);
    return m ? '233' + m[1] : null;
}

/** Send one OTP SMS. Never throws — failures come back as { ok: false }. */
async function sendOtpSms(to: string, message: string): Promise<SmsResult> {
    const phone = normalizePhone(to);
    if (!phone) return { ok: false, error: 'invalid_phone' };
    if (!MNOTIFY_API_KEY) return { ok: false, error: 'server_misconfigured' };

    try {
        const res = await fetch(`${MNOTIFY_ENDPOINT}?key=${MNOTIFY_API_KEY}`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: [phone],
                sender: OTP_SENDER_ID,
                message,
                is_schedule: false,
                schedule_date: '',
            }),
        });
        const result = await res.json().catch(() => null);
        if (result?.status === 'success') return { ok: true };
        const detail = result?.message
            ?? (result && Object.keys(result).length > 0 ? JSON.stringify(result).slice(0, 200) : 'non_json_body');
        // Key rides the query string only — it can never leak into this log.
        console.error('[mnotify] rejected (sender:', OTP_SENDER_ID, 'http:', res.status, '):', detail);
        return { ok: false, error: `${detail} (sender ${OTP_SENDER_ID} http ${res.status})` };
    } catch (err) {
        console.error('[mnotify] send failed:', err);
        return { ok: false, error: 'network_error' };
    }
}

// ── function proper ──────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SEC = 45;
const SESSION_TTL_HOURS = 12;

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
    });
}

async function sha256Hex(s: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** crypto-random 6-digit code — never Math.random for auth. */
function sixDigitCode(): string {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return String(buf[0] % 1_000_000).padStart(6, '0');
}

interface AdminRow {
    id: string;
    phone: string;
    full_name: string;
    role: string;
}

async function findAdminByPhone(
    db: ReturnType<typeof createClient>,
    phone: string,
): Promise<AdminRow | null> {
    const { data } = await db
        .from('admin_users')
        .select('id, phone, full_name, role')
        .eq('phone', phone)
        .eq('is_active', true)
        .maybeSingle();
    return (data as AdminRow | null) ?? null;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return json({});
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    let body: {
        action?: string;
        phone?: string;
        code?: string;
        products?: unknown;
        looks?: unknown;
        orders?: unknown;
        settings?: unknown;
    };
    try {
        body = await req.json();
    } catch {
        return json({ error: 'invalid_body' }, 400);
    }

    if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: 'server_misconfigured' }, 500);
    const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    // ── Bearer-token actions (session / logout) ────────────────────────────
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (body.action === 'session' || body.action === 'logout') {
        if (!token) return json({ error: 'sign_in_first' }, 401);
        const { data: session } = await db
            .from('admin_sessions')
            .select('token, expires_at, admin_users(id, phone, full_name, role)')
            .eq('token', token)
            .maybeSingle();
        if (!session || new Date(session.expires_at).getTime() < Date.now()) {
            return json({ error: 'session_expired' }, 401);
        }
        if (body.action === 'logout') {
            await db.from('admin_sessions').delete().eq('token', token);
            return json({ ok: true });
        }
        const admin = session.admin_users as AdminRow;
        return json({ admin: { phone: admin.phone, name: admin.full_name, role: admin.role } });
    }

    // ── push_data — dashboard "PUSH DATA TO SUPABASE" button ──────────────
    // Uploads the app's CURRENT local state (products, runway looks, orders,
    // store settings) with the service role. RLS keeps the anon key read-only,
    // so this is the only write path — gated by the OTP session above.
    if (body.action === 'push_data') {
        if (!token) return json({ error: 'sign_in_first' }, 401);
        const { data: session } = await db
            .from('admin_sessions')
            .select('token, expires_at')
            .eq('token', token)
            .maybeSingle();
        if (!session || new Date(session.expires_at).getTime() < Date.now()) {
            return json({ error: 'session_expired' }, 401);
        }

        const asRows = (value: unknown): Record<string, unknown>[] =>
            (Array.isArray(value) ? value : []).filter(
                (r): r is Record<string, unknown> => typeof r === 'object' && r !== null && 'id' in (r as object),
            );

        const products = asRows(body.products);
        const looks = asRows(body.looks);
        const orders = asRows(body.orders);
        const settings = typeof body.settings === 'object' && body.settings !== null
            ? (body.settings as Record<string, unknown>)
            : null;

        // Products first (runway_looks has FKs into them), then the rest.
        if (products.length > 0) {
            const { error } = await db.from('products').upsert(products, { onConflict: 'id' });
            if (error) return json({ error: `products: ${error.message}` }, 500);
        }
        if (looks.length > 0) {
            const { error } = await db.from('runway_looks').upsert(looks, { onConflict: 'id' });
            if (error) return json({ error: `runway_looks: ${error.message}` }, 500);
        }
        if (orders.length > 0) {
            const { error } = await db.from('orders').upsert(orders, { onConflict: 'id' });
            if (error) return json({ error: `orders: ${error.message}` }, 500);
        }
        if (settings && 'brand_name' in settings) {
            const { id: _ignored, ...settingsRow } = settings;
            void _ignored;
            const { error } = await db
                .from('store_settings')
                .upsert({ ...settingsRow, id: 1, updated_at: new Date().toISOString() }, { onConflict: 'id' });
            if (error) return json({ error: `store_settings: ${error.message}` }, 500);
        }

        return json({
            ok: true,
            counts: {
                products: products.length,
                looks: looks.length,
                orders: orders.length,
                settings: settings ? 1 : 0,
            },
        });
    }

    // ── Phone actions (send_otp / verify_otp) ──────────────────────────────
    const phone = normalizePhone(body.phone ?? '');
    if (!phone) return json({ error: 'Enter a valid Ghana phone number (e.g. 054 165 1298).' }, 400);

    // send_otp ────────────────────────────────────────────────────────────────
    if (body.action === 'send_otp') {
        const admin = await findAdminByPhone(db, phone);
        if (!admin) {
            return json({ error: 'This number is not an admin. Use the seeded admin phone.' }, 404);
        }

        // 45s resend cooldown — a live code sent recently is still the active one
        const { data: recent } = await db
            .from('otp_codes')
            .select('created_at')
            .eq('phone', phone)
            .is('consumed_at', null)
            .gt('created_at', new Date(Date.now() - OTP_RESEND_COOLDOWN_SEC * 1000).toISOString())
            .maybeSingle();
        if (recent) {
            return json({ error: 'A code was just sent. Wait a moment before requesting another.' }, 429);
        }

        const code = sixDigitCode();
        const codeHash = await sha256Hex(`${phone}:${code}`);

        // Single-live-per-phone: clear unconsumed, then insert fresh
        await db.from('otp_codes').delete().eq('phone', phone).is('consumed_at', null);
        const { error: insertErr } = await db.from('otp_codes').insert({
            phone,
            code_hash: codeHash,
            expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString(),
        });
        if (insertErr) {
            console.error('[admin-auth] otp insert failed:', insertErr.message);
            return json({ error: 'Could not send the code. Try again.' }, 500);
        }

        // DEMO MODE — no SMS key configured: hand the code back so the
        // presentation can still sign in (the login screen shows it in a chip).
        if (!smsConfigured()) {
            console.warn('[admin-auth] MNOTIFY_API_KEY not set — demo mode, code returned in response');
            return json({ ok: true, demo: true, code });
        }

        const sms = `Runway: your admin sign-in code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`;
        const sent = await sendOtpSms(phone, sms);
        if (!sent.ok) {
            console.error('[admin-auth] SMS send failed:', sent.error);
            return json({ error: 'We could not text that number right now. Check it and try again.', reason: sent.error }, 502);
        }
        return json({ ok: true });
    }

    // verify_otp ──────────────────────────────────────────────────────────────
    if (body.action === 'verify_otp') {
        const code = (body.code ?? '').trim();
        if (!/^\d{6}$/.test(code)) return json({ error: 'Enter the 6-digit code we texted you.' }, 400);

        const { data: otp } = await db
            .from('otp_codes')
            .select('id, code_hash, attempts, expires_at, consumed_at')
            .eq('phone', phone)
            .is('consumed_at', null)
            .maybeSingle();

        if (!otp) return json({ error: 'No active code. Send a new one and try again.' }, 404);
        if (new Date(otp.expires_at).getTime() < Date.now()) {
            await db.from('otp_codes').delete().eq('id', otp.id);
            return json({ error: 'That code expired. Send a new one.' }, 410);
        }
        if (otp.attempts >= OTP_MAX_ATTEMPTS) {
            await db.from('otp_codes').delete().eq('id', otp.id);
            return json({ error: 'Too many wrong attempts. Send a new code.' }, 429);
        }

        const candidate = await sha256Hex(`${phone}:${code}`);
        if (candidate !== otp.code_hash) {
            await db.from('otp_codes').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
            const left = OTP_MAX_ATTEMPTS - (otp.attempts + 1);
            return json({ error: left > 0 ? `Wrong code. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Too many wrong attempts. Send a new code.' }, 401);
        }

        // Code is good — consume it, find the admin, open a session
        await db.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', otp.id);
        const admin = await findAdminByPhone(db, phone);
        if (!admin) return json({ error: 'This number is not an admin.' }, 403);

        const { data: session, error: sessionErr } = await db
            .from('admin_sessions')
            .insert({
                admin_id: admin.id,
                expires_at: new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString(),
            })
            .select('token')
            .single();
        if (sessionErr || !session) {
            console.error('[admin-auth] session insert failed:', sessionErr?.message);
            return json({ error: 'Could not start your session. Try again.' }, 500);
        }

        return json({
            token: session.token,
            admin: { phone: admin.phone, name: admin.full_name, role: admin.role },
        });
    }

    return json({ error: 'unknown_action' }, 400);
});
