import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { isLocalDemoDev } from "@/lib/demoMode";
import { loadDemoUtilityChatMessages, persistDemoUtilityChatSnapshot } from "@/lib/demoUtilityChatStorage";

export function useDemoUtilityChatHydration(enabled = true) {
  const hydratedRef = useRef(false);
  const hydrateMutation = trpc.utilityChat.hydrateDemoState.useMutation();

  useEffect(() => {
    if (!enabled || !isLocalDemoDev() || hydratedRef.current) return;
    const stored = loadDemoUtilityChatMessages();
    if (stored.length === 0) return;
    hydratedRef.current = true;
    hydrateMutation.mutate({ messages: stored });
  }, [enabled, hydrateMutation]);
}

export function persistUtilityChatDemoSnapshot(snapshot?: { messages?: unknown[] }): void {
  if (!isLocalDemoDev() || !snapshot?.messages) return;
  persistDemoUtilityChatSnapshot(snapshot.messages as never);
}
