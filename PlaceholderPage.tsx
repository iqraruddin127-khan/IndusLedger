import { Construction } from 'lucide-react';
import type { PageKey } from '@/types';
import { navItems } from '@/config/navigation';

interface PlaceholderPageProps {
  pageKey: PageKey;
}

export function PlaceholderPage({ pageKey }: PlaceholderPageProps) {
  const navItem = navItems.find((item) => item.key === pageKey);
  const Icon = navItem?.icon ?? Construction;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-ring rounded-3xl bg-primary-100" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-600">
          <Icon className="h-9 w-9" />
        </div>
      </div>

      <h2 className="mt-6 font-display text-xl font-bold text-ink-800">
        {navItem?.label ?? 'Coming Soon'}
      </h2>
      <p className="mt-2 max-w-md text-sm text-ink-400">
        This module is part of the IndusLedger AI roadmap and will be built in an
        upcoming development stage. The dashboard is fully functional with demo data.
      </p>

      <div className="mt-5 flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-100 px-4 py-2.5">
        <Construction className="h-4 w-4 text-accent-500" />
        <span className="text-sm font-medium text-ink-500">Under Construction</span>
      </div>
    </div>
  );
}
