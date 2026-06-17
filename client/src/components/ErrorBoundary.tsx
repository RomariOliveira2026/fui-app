import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { fuiBrand } from "@/lib/fuiTheme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="flex w-full max-w-md flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>

            <h2 className="mb-2 text-xl font-semibold text-foreground">Algo deu errado</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              O app encontrou um erro inesperado. Você pode tentar novamente sem precisar fechar o
              aplicativo.
            </p>

            <div className="flex w-full flex-col gap-2">
              <Button className={fuiBrand.btn} onClick={this.handleRetry}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                <Home className="mr-2 h-4 w-4" />
                Voltar ao início
              </Button>
              <button
                type="button"
                onClick={this.handleReload}
                className={cn("text-xs text-muted-foreground underline-offset-2 hover:underline")}
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
