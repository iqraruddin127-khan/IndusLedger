import { type ReactNode } from 'react';
import { Factory } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left side — branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden lg:flex">
        {/* Animated grid background */}
        <div className="absolute inset-0 stat-grid-bg opacity-30" />
        <div className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl" />

        {/* Data flow lines */}
        <svg className="absolute inset-0 h-full w-full opacity-15" preserveAspectRatio="none" viewBox="0 0 800 900" fill="none">
          <path d="M 0 300 Q 200 200, 400 300 T 800 300" stroke="#14b8a6" strokeWidth="2" strokeDasharray="8 12" className="animate-data-flow" />
          <path d="M 0 500 Q 300 600, 600 500 T 800 500" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 10" className="animate-data-flow" style={{ animationDelay: '1s' }} />
          <path d="M 0 200 Q 250 100, 500 200 T 800 200" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 8" className="animate-data-flow" style={{ animationDelay: '2s' }} />
        </svg>

        <div className="relative z-10 p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-900/40">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">IndusLedger AI</h1>
              <p className="text-sm text-slate-400">Industrial Intelligence Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-12">
          <h2 className="font-display text-3xl font-bold text-white">
            Smarter factories.
            <br />
            Better decisions.
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            Predict machine failures, optimize energy costs, track inventory, and
            maintain auditable records — all in one secure platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {['Machine Health AI', 'Energy Optimization', 'Audit Logs', 'Supplier Intelligence'].map((feat) => (
              <span key={feat} className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300">
                {feat}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-12 text-xs text-slate-500">
          <p>Stage 2 — Authentication & Factory Workspaces</p>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white">IndusLedger AI</h1>
              <p className="text-xs text-slate-400">Industrial Intelligence</p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
