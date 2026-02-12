import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    private handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-dark-card rounded-xl p-8">
                    <div className="text-center max-w-md">
                        <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {this.props.fallbackTitle || 'Algo salió mal'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Ocurrió un error inesperado. Por favor, intenta recargar la página.
                        </p>
                        <details className="text-left mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                Detalles del error
                            </summary>
                            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto whitespace-pre-wrap">
                                {this.state.error?.message || 'Error desconocido'}
                            </pre>
                        </details>
                        <button
                            onClick={this.handleRetry}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dim transition-colors"
                        >
                            <RefreshCw size={16} />
                            Reintentar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
