import { FormEvent, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

interface Shape {
  kind: 'square' | 'hex';
  size: number;
  left: string;
  top: string;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  outline: boolean;
  reverse: boolean;
}

const SHAPES: Shape[] = [
  { kind: 'square', size: 92, left: '6%', top: '14%', duration: 32, delay: 0, opacity: 0.16, color: '#2563EB', outline: false, reverse: false },
  { kind: 'hex', size: 74, left: '18%', top: '68%', duration: 38, delay: -6, opacity: 0.14, color: '#3B82F6', outline: true, reverse: true },
  { kind: 'square', size: 46, left: '28%', top: '22%', duration: 26, delay: -4, opacity: 0.2, color: '#60A5FA', outline: true, reverse: false },
  { kind: 'hex', size: 120, left: '72%', top: '10%', duration: 44, delay: -10, opacity: 0.12, color: '#1D4ED8', outline: false, reverse: true },
  { kind: 'square', size: 64, left: '82%', top: '58%', duration: 30, delay: -2, opacity: 0.18, color: '#3B82F6', outline: false, reverse: false },
  { kind: 'hex', size: 54, left: '60%', top: '74%', duration: 36, delay: -8, opacity: 0.16, color: '#93C5FD', outline: true, reverse: false },
  { kind: 'square', size: 140, left: '44%', top: '-6%', duration: 48, delay: -12, opacity: 0.08, color: '#2563EB', outline: true, reverse: true },
  { kind: 'hex', size: 36, left: '48%', top: '42%', duration: 24, delay: -3, opacity: 0.2, color: '#60A5FA', outline: false, reverse: false },
  { kind: 'square', size: 28, left: '90%', top: '28%', duration: 22, delay: -7, opacity: 0.22, color: '#BFDBFE', outline: false, reverse: true },
  { kind: 'hex', size: 88, left: '-2%', top: '40%', duration: 40, delay: -14, opacity: 0.1, color: '#1E3A8A', outline: false, reverse: false },
];

function FloatingBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SHAPES.map((shape, index) => (
        <span
          key={index}
          className={`login-float ${shape.reverse ? 'login-float-reverse' : ''} ${shape.kind === 'hex' ? 'login-hex' : 'login-square'}`}
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.left,
            top: shape.top,
            opacity: shape.opacity,
            background: shape.outline ? 'transparent' : shape.color,
            border: shape.outline ? `2px solid ${shape.color}` : undefined,
            animationDuration: `${shape.duration}s`,
            animationDelay: `${shape.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function LoginPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);

    try {
      const result = await window.zs.auth.login({ email, password });
      if (result.success) {
        setUser(result.user);
        navigate('/dashboard');
        return;
      }
      setError(result.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to sign in');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A1628] px-4">
      <FloatingBackground />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[420px] rounded-[16px] bg-white px-8 py-10 shadow-[0_24px_60px_rgba(2,8,20,0.35)]"
      >
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-6 text-center text-2xl font-bold text-[#0A1628]">Welcome Back</h1>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-[#1E293B]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
            disabled={pending}
            className="w-full rounded-lg border border-[#D6DEE8] px-3 py-2.5 text-[#0A1628] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-70"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-sm font-medium text-[#1E293B]">Password</span>
          <span className="relative block">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={pending}
              className="w-full rounded-lg border border-[#D6DEE8] px-3 py-2.5 pr-11 text-[#0A1628] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-70"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-[#64748B] hover:text-[#0A1628]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0A1628] text-sm font-semibold text-white transition hover:bg-[#16324F] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
          ) : null}
          Sign In
        </button>

        <div className="mt-4 text-center">
          <button type="button" className="text-sm text-[#64748B] transition hover:text-[#2563EB]">
            Forgot password?
          </button>
        </div>

        {error ? (
          <p className="mt-4 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
