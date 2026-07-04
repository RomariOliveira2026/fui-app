import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, BellOff, X } from "lucide-react";
import { toast } from "sonner";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  onForegroundMessage,
} from "@/lib/firebase-config";
import { emitRideOfferEvent, parseRideOfferPayload } from "@/lib/rideOfferEvents";

export default function PushNotificationSetup() {
  const { canUsePrivateUserApi } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveFcmToken = trpc.user.saveFcmToken.useMutation({
    onSuccess: () => {
      toast.success("Notificações ativadas com sucesso!");
      setShowPrompt(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar token: " + error.message);
    },
  });

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported(isNotificationSupported());
    setPermission(getNotificationPermission());

    // Show prompt if permission is default and supported
    if (isNotificationSupported() && getNotificationPermission() === "default") {
      // Wait 5 seconds before showing prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // Listen for foreground messages
    if (getNotificationPermission() === "granted") {
      onForegroundMessage((payload) => {
        console.log("Foreground message:", payload);
        const data = payload.data as Record<string, string | undefined> | undefined;
        const offer = parseRideOfferPayload(data);
        if (offer) {
          emitRideOfferEvent(offer);
          return;
        }

        toast(payload.notification?.title || "Nova notificação", {
          description: payload.notification?.body,
          action: data?.url
            ? {
                label: "Ver",
                onClick: () => {
                  window.location.href = data.url!;
                },
              }
            : undefined,
        });
      });
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        // Save token to backend
        await saveFcmToken.mutateAsync({ fcmToken: token });
        setPermission("granted");
      } else {
        toast.error("Não foi possível obter permissão para notificações");
        setPermission("denied");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Erro ao ativar notificações");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show anything if not supported or demo local (sem saveFcmToken)
  if (!isSupported || !canUsePrivateUserApi) {
    return null;
  }

  // Don't show prompt if permission already granted or denied
  if (permission !== "default" || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="p-4 bg-background border-primary/20 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              Ativar Notificações
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Receba atualizações em tempo real sobre suas corridas mesmo quando não estiver no site.
            </p>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                <Bell className="h-4 w-4 mr-2" />
                {isLoading ? "Ativando..." : "Ativar"}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowPrompt(false)}
              >
                Agora não
              </Button>
            </div>
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-6 w-6"
            onClick={() => setShowPrompt(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
