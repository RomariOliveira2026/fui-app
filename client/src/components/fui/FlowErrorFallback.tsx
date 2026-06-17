import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fuiBrand } from "@/lib/fuiTheme";
import { getRideFlowErrorMessage } from "@/lib/rideFlowErrors";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

type FlowErrorFallbackProps = {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  onGoHome?: () => void;
  onReset?: () => void;
  resetLabel?: string;
};

export default function FlowErrorFallback({
  title = "Não foi possível continuar",
  error,
  onRetry,
  onGoHome,
  onReset,
  resetLabel = "Recomeçar solicitação",
}: FlowErrorFallbackProps) {
  const message = error ? getRideFlowErrorMessage(error) : "Ocorreu um erro inesperado.";

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {onRetry ? (
            <Button className={fuiBrand.btn} onClick={onRetry}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          ) : null}
          {onReset ? (
            <Button variant="outline" onClick={onReset}>
              {resetLabel}
            </Button>
          ) : null}
          {onGoHome ? (
            <Button variant="ghost" onClick={onGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
