import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { fuiBrand, fuiSurface } from "@/lib/fuiTheme";
import {
  loadDemoChatMessages,
  saveDemoChatMessages,
  type DemoChatMessageSnapshot,
} from "@/lib/demoRideStorage";

type DemoRideChatProps = {
  rideId: number;
  otherUserName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Se false, só abre via prop `open` (botão externo). */
  showFloatingButton?: boolean;
};

export default function DemoRideChat({
  rideId,
  otherUserName,
  open,
  onOpenChange,
  showFloatingButton = true,
}: DemoRideChatProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);
  const isExpanded = open ?? internalOpen;
  const setExpanded = onOpenChange ?? setInternalOpen;

  const [messages, setMessages] = useState<DemoChatMessageSnapshot[]>(() =>
    loadDemoChatMessages(rideId)
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(messages.reduce((max, m) => Math.max(max, m.id), 0) + 1);

  useEffect(() => {
    saveDemoChatMessages(rideId, messages);
  }, [rideId, messages]);

  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  const handleSend = () => {
    const text = message.trim();
    if (!text || user?.id == null) return;

    const entry: DemoChatMessageSnapshot = {
      id: nextIdRef.current++,
      senderId: user.id,
      message: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, entry]);
    setMessage("");
  };

  if (!isExpanded) {
    if (!showFloatingButton) return null;
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={() => setExpanded(true)}
          size="lg"
          className={cn("rounded-full shadow-lg", fuiBrand.btn)}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Chat com Motorista
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className={cn("shadow-xl overflow-hidden", fuiSurface.card)}>
        <CardHeader className="pb-3 border-b border-border bg-card">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="w-4 h-4" />
              </div>
              <CardTitle className="text-base truncate">Chat com {otherUserName}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)} className="shrink-0">
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="h-72 overflow-y-auto space-y-3 pr-1 rounded-lg bg-muted/30 border border-border p-3">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Demo local — envie uma mensagem ao motorista.
              </p>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-xl px-3 py-2 border",
                        isOwn
                          ? "bg-primary text-primary-foreground border-primary/30"
                          : "bg-card text-foreground border-border"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={cn("text-xs mt-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
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
                  handleSend();
                }
              }}
              className="bg-background border-border"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim()}
              size="icon"
              className={fuiBrand.btn}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
