import { Factory, Cpu, Zap, Leaf, ArrowUpRight, Activity } from 'lucide-react';

/**
 * HeroBanner — animated visual showcase at the top of the dashboard.
 * Features: animated grid background, floating machine icons,
 * pulsing data-flow rings, and live KPI highlights.
 * All data is clearly labeled as demo.
 */
interface HeroBannerProps {
  workspaceName?: string;
  userName?: string;
}

export function HeroBanner({ workspaceName, userName }: HeroBannerProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-lg animate-fade-in">
      {/* ── Animated grid background ─────────────────────────────────────── */}
      <div className="absolute inset-0 stat-grid-bg opacity-40" />

      {/* ── Radial glow ──────────────────────────────────────────────────── */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-accent-500/15 blur-3xl" />

      {/* ── Animated SVG data-flow lines ─────────────────────────────────── */}
      <svg
        className="absolute inset-0 h-full w-full opacity-20"
        preserveAspectRatio="none"
        viewBox="0 0 1200 400"
        fill="none"
      >
        <path
          d="M 0 180 Q 200 120, 400 180 T 800 180 T 1200 180"
          stroke="#14b8a6"
          strokeWidth="2"
          strokeDasharray="8 12"
          className="animate-data-flow"
        />
        <path
          d="M 0 240 Q 300 300, 600 240 T 1200 240"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="6 10"
          className="animate-data-flow"
          style={{ animationDelay: '1s' }}
        />
        <path
          d="M 0 120 Q 250 60, 500 120 T 1000 120 T 1200 120"
          stroke="#22c55e"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="animate-data-flow"
          style={{ animationDelay: '2s' }}
        />
      </svg>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="relative px-6 py-7 md:px-8 md:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: title + description */}
          <div className="max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-500/20 text-primary-400">
                <Factory className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-400">
                {workspaceName ? `${workspaceName} — Workspace` : 'Demo Workspace'}
              </span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold text-white md:text-3xl">
              {greeting}, {userName ?? 'Factory Manager'}
            </h1>
            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Here's your factory overview for today. 5 alerts need attention,
              OEE is trending up, and energy costs are down 3.4% from last week.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="demo-badge">
                <Activity className="h-3 w-3" /> Demo Data — Not Live
              </span>
              <button className="group flex items-center gap-1 text-sm font-medium text-primary-400 hover:text-primary-300">
                View detailed report
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>

          {/* Right: animated floating icon cluster */}
          <div className="relative hidden h-44 w-56 flex-shrink-0 md:block">
            {/* Pulsing center ring */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-32 w-32 rounded-full border-2 border-primary-500/30 animate-pulse-ring" />
              <div className="absolute inset-0 m-auto h-20 w-20 rounded-full border-2 border-primary-400/40 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
            </div>

            {/* Floating machine icons */}
            <div className="absolute left-4 top-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400 shadow-lg animate-float">
              <Cpu className="h-6 w-6" />
            </div>
            <div
              className="absolute right-6 top-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400 shadow-lg animate-float"
              style={{ animationDelay: '1.5s' }}
            >
              <Zap className="h-6 w-6" />
            </div>
            <div
              className="absolute bottom-4 left-10 flex h-12 w-12 items-center justify-center rounded-xl bg-success-500/20 text-success-400 shadow-lg animate-float"
              style={{ animationDelay: '0.8s' }}
            >
              <Leaf className="h-6 w-6" />
            </div>
            <div
              className="absolute bottom-8 right-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/80 text-slate-300 shadow-lg animate-float"
              style={{ animationDelay: '2s' }}
            >
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom highlight strip ───────────────────────────────────────── */}
      <div className="relative border-t border-slate-800 bg-slate-950/50 px-6 py-3 md:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-success-400 animate-pulse" />
            <span>System Online</span>
          </div>
          <div className="text-slate-500">
            <span className="text-slate-300">47</span> machines monitored
          </div>
          <div className="text-slate-500">
            <span className="text-slate-300">3</span> lines operational
          </div>
          <div className="text-slate-500">
            <span className="text-slate-300">AI Model:</span> Random Forest (pending deployment)
          </div>
          <div className="ml-auto text-slate-500">
            Last sync: <span className="text-slate-300">Demo — not synced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
