/**
 * Runway admin auth screen — a port of Kola's LoginPage / SignUpPage system:
 *   · split showcase panel (model photo under an ink wash, floating glass
 *     card, entrance cascade) shared by sign-in and sign-up
 *   · two-step sign-in: phone → 6-digit OTP (spring step slide, wall-clock
 *     fuse + 45s resend cooldown that survive reloads via sessionStorage)
 *   · 6-slot OTP input with keyboard nav, paste-anywhere, error shake and
 *     success check (Kola's otp-input, trimmed)
 *   · sign-up is VISUAL ONLY by design — nothing is wired to the backend
 *
 * The OTP itself is issued/verified by the `admin-auth` Supabase edge
 * function; this screen just drives it through src/auth.tsx.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useAuth, normalizeGhPhone } from '../auth';
import '../auth.css';

type Mode = 'signin' | 'signup';
type Step = 'phone' | 'otp';

/** Must stay in sync with the edge function's OTP_TTL_MINUTES = 10. */
export const OTP_TTL_SECONDS = 600;
const RESEND_COOLDOWN_SECONDS = 45;

const OTP_DEADLINE_KEY = 'runway_login_otp_deadline';
const COOLDOWN_DEADLINE_KEY = 'runway_login_cooldown_deadline';
const OTP_PHONE_KEY = 'runway_login_otp_phone';

/** Kola's shared entrance cascade — element-by-element rise-in. */
const authEnter = (delayMs: number) =>
    ({ animationDelay: `${delayMs}ms` }) as React.CSSProperties;

/** Kola's shared step transition — spring slide, used by both flows. */
const authStepMotion = {
    initial: { opacity: 0, x: 28 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -28 },
    transition: { type: 'spring' as const, stiffness: 380, damping: 32 },
};

// ─── OTP input (Kola otp-input port, trimmed) ───────────────────────────────

type OTPStatus = 'idle' | 'error' | 'success';

function toSlots(value: string, length: number): string[] {
    const digits = value.replace(/\D/g, '').slice(0, length);
    return Array.from({ length }, (_, i) => digits[i] ?? '');
}

function OTPInput({
    value,
    onChange,
    onComplete,
    status = 'idle',
    disabled = false,
    autoFocus = true,
}: {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    status?: OTPStatus;
    disabled?: boolean;
    autoFocus?: boolean;
}) {
    const length = 6;
    const reduce = useReducedMotion();
    const inputRef = useRef<HTMLInputElement>(null);
    const slotsRef = useRef<HTMLDivElement>(null);
    const [slots, setSlots] = useState<string[]>(() => toSlots(value, length));
    const [focused, setFocused] = useState(false);
    const [active, setActive] = useState(0);
    const joinedRef = useRef(slots.join(''));
    joinedRef.current = slots.join('');

    useEffect(() => {
        const incoming = toSlots(value, length);
        if (incoming.join('') !== joinedRef.current) setSlots(incoming);
    }, [value, length]);

    const commit = useCallback(
        (next: string[]) => {
            const wasComplete = slots.every((c) => c !== '');
            setSlots(next);
            const str = next.join('');
            onChange(str);
            if (!wasComplete && next.every((c) => c !== '')) onComplete?.(str);
        },
        [slots, onChange, onComplete],
    );

    const insert = (raw: string, from = active) => {
        const digits = raw.replace(/\D/g, '');
        if (!digits) return;
        const next = [...slots];
        let i = from;
        for (const ch of digits) {
            if (i >= length) break;
            next[i] = ch;
            i++;
        }
        commit(next);
        setActive(Math.min(i, length - 1));
    };

    // Error shake (skipped under reduced motion)
    useEffect(() => {
        if (status !== 'error' || reduce || !slotsRef.current) return;
        slotsRef.current.animate(
            [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
            { duration: 260, easing: 'ease-in-out' },
        );
    }, [status, reduce]);

    return (
        <div
            className={`otp-input ${status === 'error' ? 'otp-input--error' : ''} ${status === 'success' ? 'otp-input--success' : ''}`}
            onClick={() => inputRef.current?.focus()}
        >
            <div className="otp-input__slots" ref={slotsRef}>
                {slots.map((char, i) => (
                    <div
                        key={i}
                        className={`otp-slot ${char ? 'otp-slot--filled' : ''} ${focused && active === i ? 'otp-slot--active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActive(i);
                            inputRef.current?.focus();
                        }}
                    >
                        {char ? (
                            <motion.span
                                key={char + i}
                                initial={reduce ? false : { opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.12 }}
                            >
                                {char}
                            </motion.span>
                        ) : focused && active === i ? (
                            <motion.span
                                className="otp-caret"
                                initial={reduce ? false : { opacity: 0 }}
                                animate={{ opacity: [1, 1, 0, 0] }}
                                transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
                            />
                        ) : null}
                    </div>
                ))}
            </div>
            <input
                ref={inputRef}
                className="otp-input__field"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="One-time passcode"
                disabled={disabled}
                autoFocus={autoFocus}
                value={slots.join('')}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    if (digits) {
                        commit(toSlots(digits, length));
                        setActive(Math.min(digits.length, length - 1));
                    }
                }}
                onKeyDown={(e) => {
                    if (disabled || e.metaKey || e.ctrlKey || e.altKey) return;
                    if (/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                        insert(e.key);
                    } else if (e.key === 'Backspace') {
                        e.preventDefault();
                        const next = [...slots];
                        if (next[active]) next[active] = '';
                        else if (active > 0) {
                            next[active - 1] = '';
                            setActive(active - 1);
                        }
                        commit(next);
                    } else if (e.key === 'Delete') {
                        e.preventDefault();
                        const next = [...slots];
                        next[active] = '';
                        commit(next);
                    } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        setActive((a) => Math.max(0, a - 1));
                    } else if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        setActive((a) => Math.min(length - 1, a + 1));
                    } else if (e.key === 'Home') {
                        setActive(0);
                    } else if (e.key === 'End') {
                        setActive(length - 1);
                    }
                }}
                onPaste={(e) => {
                    if (disabled) return;
                    e.preventDefault();
                    insert(e.clipboardData.getData('text'));
                }}
            />
        </div>
    );
}

// ─── Shared showcase panel (Kola AuthShowcase port) ─────────────────────────

const SHOWCASE_PHOTO = '/assets/fit-1-model.webp';

const ShowcaseCard = () => (
    <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="auth-showcase-card"
    >
        <div className="auth-showcase-card__top">
            <span className="auth-showcase-card__brand">Runway Desk</span>
            <span className="auth-showcase-card__badge">Realtime</span>
        </div>
        <p className="auth-showcase-card__title">Every order, one screen.</p>
        <p className="auth-showcase-card__sub">Catalog, looks and dispatch stay in sync as tickets land.</p>
        <div className="auth-showcase-card__chips">
            {['Catalog', 'Runway', 'Orders', 'Analytics'].map((chip) => (
                <span key={chip}>{chip}</span>
            ))}
        </div>
    </motion.div>
);

function AuthShowcase({ mode }: { mode: Mode }) {
    return (
        <aside className="auth-showcase">
            <img src={SHOWCASE_PHOTO} alt="" aria-hidden="true" draggable={false} />
            <div className="auth-showcase__wash" />

            <div className="auth-showcase__logo" style={authEnter(0)}>
                <span className="auth-showcase__mark">R</span>
            </div>

            <div className="auth-showcase__body">
                <span className="auth-showcase__eyebrow" style={authEnter(90)}>
                    Runway Admin Desk
                </span>
                <h2 className="auth-showcase__heading" style={authEnter(160)}>
                    {mode === 'signin' ? (
                        <>
                            Run the showroom,
                            <br />
                            <span className="auth-showcase__heading-fade">not the spreadsheets.</span>
                        </>
                    ) : (
                        <>
                            Open your label
                            <br />
                            <span className="auth-showcase__heading-fade">in minutes.</span>
                        </>
                    )}
                </h2>
                <p className="auth-showcase__sub" style={authEnter(220)}>
                    {mode === 'signin'
                        ? 'Catalog, runway looks, orders and money — one terminal that works as hard as your atelier does.'
                        : 'One phone number is all it takes. Set up your looks, take your first order and dispatch your first delivery today.'}
                </p>
                <ul className="auth-showcase__points" style={authEnter(280)}>
                    {[
                        'Live catalog synced from Supabase',
                        'Runway looks pinned to real SKUs',
                        'MoMo orders with transparent route fees',
                    ].map((point) => (
                        <li key={point}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 12l2 2 4-4" />
                                <circle cx="12" cy="12" r="9" />
                            </svg>
                            {point}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="auth-showcase__footer" style={authEnter(360)}>
                <ShowcaseCard />
            </div>
        </aside>
    );
}

// ─── The screen ─────────────────────────────────────────────────────────────

export function AuthScreen() {
    const { sendOtp, verifyOtp, isAuthed, admin } = useAuth();
    const [mode, setMode] = useState<Mode>('signin');
    const [step, setStep] = useState<Step>('phone');

    const [phone, setPhone] = useState(() => {
        try {
            return sessionStorage.getItem(OTP_PHONE_KEY) ?? '';
        } catch {
            return '';
        }
    });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [demoCode, setDemoCode] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Sign-up (visual only) fields — deliberately never sent anywhere.
    const [signUpName, setSignUpName] = useState('');
    const [signUpPhone, setSignUpPhone] = useState('');
    const [signUpBrand, setSignUpBrand] = useState('');

    // ── Kola's wall-clock fuse: deadlines persist in sessionStorage so a live
    // code keeps burning honestly across remounts AND reloads. Derived displays
    // recompute from Date.now() on a 1s heartbeat.
    const readDeadline = (key: string): number => {
        try {
            const v = Number(sessionStorage.getItem(key) ?? 0);
            return Number.isFinite(v) && v > Date.now() ? v : 0;
        } catch {
            return 0;
        }
    };
    const armDeadline = (key: string, seconds: number): number => {
        const at = Date.now() + seconds * 1000;
        try {
            sessionStorage.setItem(key, String(at));
        } catch { /* private mode — the in-memory fuse still ticks */ }
        return at;
    };
    const [otpDeadline, setOtpDeadline] = useState(() => readDeadline(OTP_DEADLINE_KEY));
    const [cooldownDeadline, setCooldownDeadline] = useState(() => readDeadline(COOLDOWN_DEADLINE_KEY));
    const [, setHeartbeat] = useState(0);
    const anyDeadlineLive = otpDeadline > Date.now() || cooldownDeadline > Date.now();
    useEffect(() => {
        if (!anyDeadlineLive) return;
        const i = window.setInterval(() => setHeartbeat((b) => b + 1), 1000);
        return () => window.clearInterval(i);
    }, [anyDeadlineLive]);
    const secondsLeft = otpDeadline > 0 ? Math.max(0, Math.ceil((otpDeadline - Date.now()) / 1000)) : 0;
    const cooldownLeft = cooldownDeadline > 0 ? Math.max(0, Math.ceil((cooldownDeadline - Date.now()) / 1000)) : 0;

    const storeOtpPhone = (p: string) => {
        try {
            sessionStorage.setItem(OTP_PHONE_KEY, p);
        } catch { /* best effort */ }
    };

    const handleSendCode = async (e?: FormEvent) => {
        e?.preventDefault();
        if (busy) return;
        setError(null);
        setNotice(null);
        setDemoCode(null);
        if (!normalizeGhPhone(phone)) {
            setError('Enter a valid Ghana phone number (e.g. 054 165 1298).');
            return;
        }
        setBusy(true);
        const res = await sendOtp(phone);
        setBusy(false);
        if (res.error) {
            // Cooldown (429): a live code went out <45s ago and is still the
            // active one — join it at the OTP step instead of erroring.
            if (/just sent/i.test(res.error)) {
                setOtp('');
                storeOtpPhone(phone);
                setStep('otp');
                setCooldownDeadline(armDeadline(COOLDOWN_DEADLINE_KEY, RESEND_COOLDOWN_SECONDS));
                setOtpDeadline(armDeadline(OTP_DEADLINE_KEY, OTP_TTL_SECONDS));
                setNotice('Your code is already on its way');
                return;
            }
            setError(res.error);
            return;
        }
        setOtp('');
        storeOtpPhone(phone);
        setStep('otp');
        setCooldownDeadline(armDeadline(COOLDOWN_DEADLINE_KEY, RESEND_COOLDOWN_SECONDS));
        setOtpDeadline(armDeadline(OTP_DEADLINE_KEY, OTP_TTL_SECONDS));
        if (res.demoCode) {
            // Demo mode (no SMS key on the function): show + auto-fill the code.
            setDemoCode(res.demoCode);
            setOtp(res.demoCode);
        } else {
            setNotice(`Sign-in code sent to ${phone}`);
        }
    };

    const handleVerifyOtp = async (codeArg?: string) => {
        const code = codeArg ?? otp;
        if (busy) return;
        if (!/^\d{6}$/.test(code)) {
            setError('Enter the 6-digit code we sent you.');
            return;
        }
        setError(null);
        setBusy(true);
        const res = await verifyOtp(phone, code);
        setBusy(false);
        if (res.error) {
            setError(res.error);
            setOtp('');
            return;
        }
        window.location.hash = '#admin';
    };

    const close = () => {
        window.location.hash = '#home';
    };

    return (
        <div className="auth-overlay" role="dialog" aria-modal="true" aria-label="Runway admin sign in">
            <AuthShowcase mode={mode} />

            <div className="auth-panel">
                <button className="auth-close" onClick={close} aria-label="Back to the storefront">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="auth-card">
                    <div className="auth-wordmark">
                        <span className="auth-wordmark__mark">R</span>
                        <span className="auth-wordmark__name">Runway Admin</span>
                    </div>

                    {/* Sign-in / Sign-up segmented tab (spring slide, Kola style) */}
                    <div className="auth-tabs" role="tablist">
                        {(['signin', 'signup'] as Mode[]).map((m) => (
                            <button
                                key={m}
                                role="tab"
                                aria-selected={mode === m}
                                className={`auth-tab ${mode === m ? 'auth-tab--on' : ''}`}
                                onClick={() => {
                                    setMode(m);
                                    setError(null);
                                    setNotice(null);
                                    setDemoCode(null);
                                }}
                            >
                                {m === 'signin' ? 'Sign in' : 'Sign up'}
                                {mode === m && <motion.span layoutId="auth-tab-pill" className="auth-tab__pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {mode === 'signin' ? (
                            <motion.div key="signin" {...authStepMotion} className="auth-flow">
                                <h1 className="auth-heading">{step === 'otp' ? 'Enter your code' : 'Sign in'}</h1>
                                <p className="auth-sub">
                                    {step === 'otp' ? (
                                        <>We sent a 6-digit <strong>sign-in code</strong> to {phone || 'your phone'}.</>
                                    ) : (
                                        <>Use the <strong>admin phone</strong> — a texted code opens the dashboard.</>
                                    )}
                                </p>

                                {isAuthed && (
                                    <div className="auth-note auth-note--ok">
                                        Signed in as {admin?.name}. <a href="#admin" className="auth-note__link">Go to the dashboard →</a>
                                    </div>
                                )}

                                <AnimatePresence mode="wait" initial={false}>
                                    {step === 'phone' ? (
                                        <motion.form
                                            key="phone-step"
                                            {...authStepMotion}
                                            className="auth-form"
                                            onSubmit={handleSendCode}
                                        >
                                            <label className="auth-field">
                                                <span className="auth-field__label">Phone number</span>
                                                <div className="auth-field__control">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                                    </svg>
                                                    <input
                                                        type="tel"
                                                        inputMode="tel"
                                                        autoComplete="tel"
                                                        placeholder="054 165 1298"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value)}
                                                        aria-label="Phone number"
                                                    />
                                                </div>
                                            </label>

                                            {error && <div className="auth-note auth-note--error" role="alert">{error}</div>}

                                            <button type="submit" className="auth-btn" disabled={busy}>
                                                {busy ? <span className="auth-spinner" aria-label="Sending" /> : <>Send sign-in code</>}
                                            </button>
                                        </motion.form>
                                    ) : (
                                        <motion.form
                                            key="otp-step"
                                            {...authStepMotion}
                                            className="auth-form"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                void handleVerifyOtp();
                                            }}
                                        >
                                            <OTPInput
                                                value={otp}
                                                status={error ? 'error' : 'idle'}
                                                onChange={(v) => {
                                                    setOtp(v);
                                                    if (error) setError(null);
                                                }}
                                                onComplete={(v) => void handleVerifyOtp(v)}
                                            />

                                            <div className="auth-otp-meta">
                                                {secondsLeft > 0 ? (
                                                    <span className="auth-fuse">Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>
                                                ) : (
                                                    <span className="auth-fuse auth-fuse--dead">Code expired — resend to get a new one.</span>
                                                )}
                                                <button
                                                    type="button"
                                                    className="auth-resend"
                                                    disabled={cooldownLeft > 0 || busy}
                                                    onClick={() => void handleSendCode()}
                                                >
                                                    {cooldownLeft > 0 ? `Resend in ${cooldownLeft}s` : 'Resend code'}
                                                </button>
                                            </div>

                                            {demoCode && (
                                                <div className="auth-note auth-note--demo">
                                                    Demo mode (no SMS key) — code <strong className="auth-demo-code">{demoCode}</strong>
                                                </div>
                                            )}
                                            {notice && !demoCode && <div className="auth-note auth-note--ok">{notice}</div>}
                                            {error && <div className="auth-note auth-note--error" role="alert">{error}</div>}

                                            <button type="submit" className="auth-btn" disabled={busy}>
                                                {busy ? <span className="auth-spinner" aria-label="Verifying" /> : <>Verify & open dashboard</>}
                                            </button>
                                            <button type="button" className="auth-back" onClick={() => { setStep('phone'); setError(null); }}>
                                                ← Use a different number
                                            </button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div key="signup" {...authStepMotion} className="auth-flow">
                                <h1 className="auth-heading">Create your label</h1>
                                <p className="auth-sub">
                                    One phone number is all it takes. <strong>Sign-up is decorative</strong> in this demo build — nothing is submitted.
                                </p>

                                <form
                                    className="auth-form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        setNotice('Sign-up is not wired in this demo build — use the seeded admin phone to sign in.');
                                    }}
                                >
                                    <label className="auth-field">
                                        <span className="auth-field__label">Your name</span>
                                        <div className="auth-field__control">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                            </svg>
                                            <input value={signUpName} onChange={(e) => setSignUpName(e.target.value)} placeholder="Adwoa Runway" aria-label="Your name" />
                                        </div>
                                    </label>
                                    <label className="auth-field">
                                        <span className="auth-field__label">Label / brand name</span>
                                        <div className="auth-field__control">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="0.5" />
                                            </svg>
                                            <input value={signUpBrand} onChange={(e) => setSignUpBrand(e.target.value)} placeholder="Around Clothing" aria-label="Brand name" />
                                        </div>
                                    </label>
                                    <label className="auth-field">
                                        <span className="auth-field__label">Phone number</span>
                                        <div className="auth-field__control">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                            <input type="tel" inputMode="tel" value={signUpPhone} onChange={(e) => setSignUpPhone(e.target.value)} placeholder="054 165 1298" aria-label="Phone number" />
                                        </div>
                                    </label>

                                    {notice && <div className="auth-note auth-note--demo" role="status">{notice}</div>}

                                    <button type="submit" className="auth-btn auth-btn--ghost">
                                        Create account
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
