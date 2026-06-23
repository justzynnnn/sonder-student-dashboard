import { Component } from 'react';
import { RefreshCw } from 'lucide-react';

// Catches render crashes and shows a recovery screen instead of a white page
// (plan §7.5). Errors are logged locally only — no PII leaves the device.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Sonder render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-sm">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-brand/10 text-brand"><RefreshCw size={28} /></div>
          <h1 className="font-display text-xl font-extrabold">Something hiccuped</h1>
          <p className="mt-1 text-sm text-muted">Your data is safe on your device. A refresh usually sorts it out.</p>
          <button className="btn-primary mt-5" onClick={() => window.location.reload()}>
            Reload Sonder
          </button>
        </div>
      </div>
    );
  }
}
