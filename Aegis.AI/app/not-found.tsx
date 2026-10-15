import Link from 'next/link';
import { ArrowRight, SearchX } from 'lucide-react';

import { buttonClasses } from '@/components/ui-aegis/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] max-w-xl flex-col justify-center py-12">
      <p className="flex items-center gap-2 font-mono text-sm text-aegis-muted">
        <SearchX className="h-4 w-4" aria-hidden="true" />
        404
      </p>
      <h1 className="mt-3 text-title text-aegis-ink">Page not found</h1>
      <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-aegis-muted">
        The page you asked for does not exist or has moved. The analytics console is the
        best place to continue.
      </p>
      <div className="bg-grad-severity mt-6 h-0.5 w-24 rounded-full" aria-hidden="true" />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard" className={buttonClasses('primary')}>
          Go to the Executive Overview
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/" className={buttonClasses('secondary')}>
          Back to the landing page
        </Link>
      </div>
    </div>
  );
}
