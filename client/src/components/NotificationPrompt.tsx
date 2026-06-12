import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { isLandingRoute } from "@/components/landing/landingRoutes";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

export default function NotificationPrompt() {
  const [location] = useLocation();
  const { user, canUsePrivateUserApi } = useAuth();
  const { permission, requestPermission, isConfigured } = usePushNotifications(
    canUsePrivateUserApi ? user?.id : undefined
  );
  const [dismissed, setDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if user has already dismissed the prompt
  useEffect(() => {
    const isDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  const handleEnable = async () => {
    if (isRequesting) return;
    setIsRequesting(true);

    try {
      // Check if we're in preview environment (manusvm.computer domain)
      const isPreviewEnv = window.location.hostname.includes('manusvm.computer');

      if (isPreviewEnv) {
        toast.info(
          "Notificações não funcionam no ambiente de preview. Publique o app e acesse pelo domínio oficial para testar.",
          { duration: 6000 }
        );
        handleDismiss();
        return;
      }

      // Check if permission was already denied by the browser previously
      if (Notification.permission === "denied") {
        // Browser already blocked notifications - dismiss silently and show a gentle info
        toast.info(
          "As notificações estão bloqueadas pelo navegador. Você pode ativá-las nas configurações do seu navegador a qualquer momento.",
          { duration: 6000 }
        );
        handleDismiss();
        return;
      }

      const granted = await requestPermission();

      if (granted) {
        // Success - prompt will auto-hide since permission === "granted"
        handleDismiss();
      } else {
        // Permission denied or dismissed - just close the prompt quietly
        // No error toast needed, the user made a conscious choice
        handleDismiss();
      }
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show if:
  // - User is not logged in
  // - Firebase not configured
  // - Already granted permission
  // - Permission already denied by browser (no point showing the prompt)
  // - User dismissed the prompt
  if (
    isLandingRoute(location) ||
    !canUsePrivateUserApi ||
    !user ||
    !isConfigured ||
    permission === "granted" ||
    permission === "denied" ||
    dismissed
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Ativar Notificações</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Receba atualizações em tempo real sobre suas corridas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <ul className="space-y-1">
              <li>✓ Motorista aceitou a corrida</li>
              <li>✓ Motorista está a caminho</li>
              <li>✓ Motorista chegou no local</li>
            </ul>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleEnable} className="flex-1" disabled={isRequesting}>
              <Bell className="w-4 h-4 mr-2" />
              {isRequesting ? "Ativando..." : "Ativar"}
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Agora não
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
