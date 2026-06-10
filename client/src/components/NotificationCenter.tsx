import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, X, Check, CheckCheck, Trash2, Car, CreditCard, Tag, AlertTriangle, User, Shield } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const notificationIcons = {
  ride: Car,
  payment: CreditCard,
  promotion: Tag,
  system: AlertTriangle,
  driver: User,
  safety: Shield,
};

const notificationColors = {
  ride: "text-primary",
  payment: "text-green-500",
  promotion: "text-primary",
  system: "text-yellow-500",
  driver: "text-blue-500",
  safety: "text-red-500",
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { canUsePrivateUserApi } = useAuth();
  const utils = trpc.useUtils();

  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery(undefined, {
    enabled: canUsePrivateUserApi,
    refetchInterval: canUsePrivateUserApi ? 30000 : false,
  });

  const { data: notifications, isLoading } = trpc.notification.list.useQuery(
    { limit: 50 },
    { enabled: canUsePrivateUserApi && open }
  );

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("Todas as notificações marcadas como lidas");
      utils.notification.list.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const deleteNotification = trpc.notification.delete.useMutation({
    onSuccess: () => {
      toast.success("Notificação removida");
      utils.notification.list.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead.mutate({ notificationId: notification.id });
    }
    
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setOpen(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {(unreadCount?.count || 0) > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs font-bold text-white flex items-center justify-center">
              {unreadCount?.count! > 9 ? "9+" : unreadCount?.count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-background border-border">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-foreground">Notificações</SheetTitle>
            {notifications && notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="text-primary hover:text-primary/80"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          )}

          {!isLoading && notifications && notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma notificação</p>
            </div>
          )}

          {notifications?.map((notification) => {
            const Icon = notificationIcons[notification.type];
            const iconColor = notificationColors[notification.type];

            return (
              <div
                key={notification.id}
                className={`
                  p-4 rounded-lg border transition-all cursor-pointer
                  ${notification.isRead 
                    ? "bg-background border-border hover:bg-accent" 
                    : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  }
                `}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className={`flex-shrink-0 ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-semibold text-sm ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      
                      <div className="flex gap-1">
                        {notification.actionLabel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary hover:text-primary/80"
                          >
                            {notification.actionLabel}
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification.mutate({ notificationId: notification.id });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
