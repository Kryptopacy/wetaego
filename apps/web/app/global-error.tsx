'use client';
 
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
 
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
 
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Critical System Error</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              A fatal error occurred. Our team has been notified and is looking into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 dark:bg-white px-8 text-sm font-medium text-zinc-50 dark:text-zinc-900 transition-colors hover:bg-zinc-900/90 dark:hover:bg-zinc-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
