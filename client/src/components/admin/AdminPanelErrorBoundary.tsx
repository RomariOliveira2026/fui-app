import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminPanelCard, adminSectionSubtitle, adminSectionTitle } from "@/lib/adminShell";
import { cn } from "@/lib/utils";

type Props = { children: ReactNode; title?: string };

type State = { error: Error | null };

export default class AdminPanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AdminPanel]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className={cn(adminPanelCard, "p-8 text-center space-y-4 min-h-[240px] flex flex-col items-center justify-center")}>
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <div>
            <h2 className={adminSectionTitle}>{this.props.title ?? "Erro no painel"}</h2>
            <p className={cn(adminSectionSubtitle, "mt-2 max-w-md mx-auto")}>
              {this.state.error.message || "Falha ao renderizar este módulo."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => this.setState({ error: null })}>
            Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
