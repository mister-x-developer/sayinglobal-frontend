'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary — catches render errors and shows a premium recovery UI.
 * Logs to console in development.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <RefreshCw className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h2 className="display-sm mt-5">Nimadir notoʻgʻri ketdi</h2>
          <p className="mt-2 text-sm text-fg-muted">
            Sahifani yangilang yoki bosh sahifaga qayting.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="btn btn-primary btn-sm"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2.25} />
              Qayta urinish
            </button>
            {/* Hard navigation is intentional: after a render crash we want a
                full page reload to reset any corrupt client state rather than
                client-side routing via <Link>. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="btn btn-secondary btn-sm">
              <Home className="h-4 w-4" strokeWidth={1.75} />
              Bosh sahifa
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
