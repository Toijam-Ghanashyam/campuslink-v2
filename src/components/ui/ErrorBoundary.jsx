import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-paper p-8 rounded-2xl border border-line shadow-subtle text-center">
            <div className="w-12 h-12 rounded-full bg-brick-tint text-brick mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 stroke-[1.75]" />
            </div>
            <h3 className="font-display font-semibold text-xl text-ink mb-2">
              Something went wrong
            </h3>
            <p className="text-xs text-ink-soft mb-6 leading-relaxed">
              An unexpected error occurred in this section. The platform state is safeguarded.
            </p>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={this.handleReset}
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

