import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
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

// An original, abstract "spinning bobbin" motif tiled as a dim background
// pattern — nods to the spinning-machinery business without using any
// photo/stock imagery (keeps things lightweight and licence-free).
function ThreadPattern() {
  return (
    <svg className="absolute inset-0 h-full w-full text-white/[0.05]" preserveAspectRatio="xMidYMid slice">
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
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex flex-col justify-between overflow-hidden bg-ink px-8 py-10 text-white lg:w-1/2 lg:px-12 lg:py-12">
        <ThreadPattern />
        <CrescentMark className="pointer-events-none absolute -bottom-24 -left-20 h-[420px] w-[420px] text-white/[0.06]" />
        <CrescentMark className="pointer-events-none absolute -top-16 right-0 h-64 w-64 text-white/[0.05]" />
        <div className="relative z-10">
          <p className="font-display text-2xl font-bold">M Riaz Trading</p>
          <p className="mt-1 text-sm text-white/50">Spinning machinery parts &amp; trading</p>
        </div>
        <div className="relative z-10 mt-10 max-w-sm lg:mt-0">
          <p className="font-display text-2xl font-semibold leading-snug lg:text-3xl">
            Stock, sales, and billing — in one place, for both your companies.
          </p>
          <p className="mt-4 text-sm text-white/50">
            Main Bazar, Nishatabad, Near Nishat Mills Ltd, Faisalabad.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-surface px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
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
        </div>
      </div>
    </div>
  );
}
