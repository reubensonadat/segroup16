// =============================================================================
// _shared/mnotify.ts — mNotify SMS client (ported from Kola, trimmed to what
// the Runway admin-auth function needs: one OTP send + phone normalization).
//
// The API key NEVER leaves the server. Get one at mnotify.com (Ghana).
// If MNOTIFY_API_KEY is not set as a function secret, admin-auth falls back
// to DEMO MODE and returns the code in the JSON response instead of texting
// (perfect for the presentation — no SMS credits needed to log in).
// =============================================================================

const MNOTIFY_API_KEY = Deno.env.get('MNOTIFY_API_KEY') ?? '';
const MNOTIFY_ENDPOINT = 'https://api.mnotify.com/api/sms/quick';

/** LOCKED OTP SENDER — hardcoded to `Kola` (registered OTP-type at mNotify).
 * No env override, no caller override — every auth code texts from Kola. */
export const OTP_SENDER_ID = 'Kola';

export interface SmsResult {
    ok: boolean;
    error?: string;
}

/** True when SMS is wired — callers use this to pick real-SMS vs demo mode. */
export function smsConfigured(): boolean {
    return MNOTIFY_API_KEY.length > 0;
}

/**
 * Normalize a Ghana phone number to 233XXXXXXXXX. Accepts every entry habit:
 * 0244…, +233…, 233…, 00233…, and stacked combos, whitespace stripped first.
 */
export function normalizePhone(input: string): string | null {
    if (!input) return null;
    const digits = String(input).replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const m = digits.match(/^(?:00)?(?:233)?0*([235]\d{8})$/);
    return m ? '233' + m[1] : null;
}

/** Send one OTP SMS. Never throws — failures come back as { ok: false }. */
export async function sendOtpSms(to: string, message: string): Promise<SmsResult> {
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
