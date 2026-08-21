'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Warning, ArrowCounterClockwise } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/app-icon';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
            <AppIcon icon={Warning} size={32} weight="duotone" />
          </div>
          <h2 className="text-xl font-black text-white uppercase font-display">Something went wrong</h2>
          <p className="text-steel max-w-sm text-sm font-medium">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => this.setState({ hasError: false, error: null })}
            leftIcon={<AppIcon icon={ArrowCounterClockwise} size={16} weight="bold" />}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
