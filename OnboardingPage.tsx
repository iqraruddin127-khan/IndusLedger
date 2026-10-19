import { useState } from 'react';
import { Factory, Loader2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useWorkspaces } from '@/lib/useWorkspaces';

interface OnboardingPageProps {
  onComplete: () => void;
}

const industries = [
  { value: 'textile', label: 'Textile Manufacturing' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'cement', label: 'Cement & Construction' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'other', label: 'Other Industry' },
];

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const { user } = useAuth();
  const { createWorkspace } = useWorkspaces();
  const [factoryName, setFactoryName] = useState('');
  const [industry, setIndustry] = useState('textile');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'there';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!factoryName.trim()) {
      setError('Please enter a factory name.');
      return;
    }

    setLoading(true);
    const { error: createError } = await createWorkspace(factoryName.trim(), industry);
    if (createError) {
      setError(createError);
      setLoading(false);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 py-12">
      {/* Background effects */}
      <div className="absolute inset-0 stat-grid-bg opacity-20" />
      <div className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-primary-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg">
            <Factory className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white">IndusLedger AI</h1>
            <p className="text-xs text-slate-400">Workspace Setup</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-sm animate-fade-in-up">
          {/* Greeting */}
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-400">Welcome, {displayName}</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Create your factory workspace</h2>
            <p className="mt-2 text-sm text-slate-300">
              Your workspace is a private, isolated space for your factory's data. Only you and
              team members you invite can access it. Each factory gets its own separate workspace.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400 animate-fade-in">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Factory name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-200">Factory name</label>
              <input
                type="text"
                required
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                placeholder="e.g. Northwind Textile Plant"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 py-2.5 px-4 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>

            {/* Industry selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-200">Industry type</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {industries.map((ind) => (
                  <button
                    key={ind.value}
                    type="button"
                    onClick={() => setIndustry(ind.value)}
                    className={`
                      rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-all
                      ${industry === ind.value
                        ? 'border-primary-500 bg-primary-500/15 text-primary-300'
                        : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500'
                      }
                    `}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/30 transition-all hover:from-primary-500 hover:to-primary-600 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {loading ? 'Creating workspace...' : 'Create workspace & continue'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Your data is protected by Row Level Security — other factories cannot see your records.
        </p>
      </div>
    </div>
  );
}
