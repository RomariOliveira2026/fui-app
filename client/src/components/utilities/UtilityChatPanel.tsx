import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { isLocalDemoDev } from "@/lib/demoMode";
import { persistUtilityChatDemoSnapshot } from "@/lib/useDemoUtilityChatHydration";

type Props = {
  orderId: number;
  enabled?: boolean;
  otherPartyLabel?: string;
  compact?: boolean;
};

export default function UtilityChatPanel({
  orderId,
  enabled = true,
  otherPartyLabel = "Prestador",
  compact = false,
}: Props) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: messages, isLoading } = trpc.utilityChat.getMessages.useQuery(
    { orderId },
    {
      enabled: enabled && orderId > 0,
      refetchInterval: 3000,
      retry: false,
    }
  );

  const sendMutation = trpc.utilityChat.send.useMutation({
    onSuccess: (data) => {
      setMessage("");
      if (isLocalDemoDev() && data.demoSnapshot) {
        persistUtilityChatDemoSnapshot(data.demoSnapshot);
      }
      void utils.utilityChat.getMessages.invalidate({ orderId });
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!enabled) {
    return (
      <Card className="border-border/70">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Chat disponível após aceite do prestador.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          Chat · {otherPartyLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={cn(
            "overflow-y-auto space-y-2 pr-1 rounded-lg border border-border/60 bg-muted/10 p-3",
            compact ? "h-48" : "h-64"
          )}
        >
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-6">Carregando...</p>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <p
                      className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-sm text-muted-foreground py-6">
              Nenhuma mensagem ainda. Combine detalhes da coleta ou entrega.
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (message.trim()) sendMutation.mutate({ orderId, message: message.trim() });
              }
            }}
            disabled={sendMutation.isPending}
          />
          <Button
            size="icon"
            className="shrink-0"
            disabled={!message.trim() || sendMutation.isPending}
            onClick={() => sendMutation.mutate({ orderId, message: message.trim() })}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
