import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="arena-shell rounded-[2rem] p-8 text-center">
            <p className="text-xs uppercase tracking-[0.45em] text-arena-300">Unexpected Error</p>
            <h1 className="mt-4 font-display text-5xl uppercase text-white">Arena Systems Offline</h1>
            <p className="mt-4 text-sm text-arena-100/75">
              Something went wrong while rendering this page. Refresh and try again.
            </p>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

