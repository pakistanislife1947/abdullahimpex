import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function CrescentMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <path
        d="M62 8C40 8 22 26 22 50s18 42 40 42c6 0 12-1.3 17-3.7C66 93 53 98 39 98 17.5 98 0 76.6 0 50S17.5 2 39 2c14 0 27 5 23 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ThreadPattern() {
  return (
    <svg className="absolute inset-0 h-full w-full text-white/[0.06]" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="bobbin" width="120" height="120" patternUnits="userSpaceOnUse">
          <circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="60" cy="60" r="24" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="60" cy="60" r="3" fill="currentColor" />
          {[0, 45, 90, 135].map((deg) => (
            <line
              key={deg}
              x1="60"
              y1="60"
              x2={60 + 34 * Math.cos((deg * Math.PI) / 180)}
              y2={60 + 34 * Math.sin((deg * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="0.75"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bobbin)" />
    </svg>
  );
}

export default function Login() {
  const { session, signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);
    if (result.error) setError('Incorrect email or password.');
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      {/* Branding panel */}
      <div
        className="relative flex flex-col justify-between overflow-hidden px-8 py-10 text-white lg:w-[58%] lg:px-16 lg:py-14"
        style={{ background: 'radial-gradient(130% 150% at 12% 8%, #1d1c1a 0%, #121110 55%, #08080 100%)' }}
      >
        <ThreadPattern />
        <CrescentMark className="pointer-events-none absolute -bottom-28 -left-24 h-[480px] w-[480px] text-white/[0.07]" />
        <CrescentMark className="pointer-events-none absolute -top-20 right-[-5rem] h-80 w-80 text-white/[0.05]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-lg bg-white/95 p-2 shadow-lg">
            <img src="/mriaz-logo.png" alt="M Riaz Trading" className="h-9 w-auto" />
          </div>
          <div className="h-9 w-px bg-white/15" />
          <div>
            <p className="font-display text-lg font-bold leading-tight">M Riaz Trading</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/40">Inventory &amp; Billing Platform</p>
          </div>
        </div>

        <div className="relative z-10 mt-14 max-w-md lg:mt-0">
          <p className="font-display text-3xl font-semibold leading-snug tracking-tight lg:text-[2.6rem]">
            Stock, sales, and billing —<br className="hidden lg:block" /> one system, two companies.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-white/45">
            Main Bazar, Nishatabad, Near Nishat Mills Ltd, Faisalabad.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Real-time stock', 'Dual-company invoicing', 'Encrypted access', 'Monthly ledgers'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/55"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[10px] uppercase tracking-[0.18em] text-white/25">
          Powered by Quantum Solutions Group
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-12 lg:w-[42%]">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-pop">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <img src="/mriaz-logo.png" alt="M Riaz Trading" className="h-9 w-auto" />
            <p className="font-display text-base font-bold text-ink">M Riaz Trading</p>
          </div>

          <h1 className="font-display text-2xl font-bold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">Admin access only.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-1.5 text-xs text-ink-faint">
            <ShieldCheck size={13} />
            Your data is encrypted and only accessible to signed-in admins.
          </div>

          <p className="mt-6 text-center text-[10px] uppercase tracking-[0.16em] text-ink-faint/70 lg:hidden">
            Powered by Quantum Solutions Group
          </p>
        </div>
      </div>
    </div>
  );
}
