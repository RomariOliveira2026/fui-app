export type DemoUtilityChatMessage = {
  id: number;
  orderId: number;
  senderId: number;
  message: string;
  createdAt: string;
};

export const FUI_DEMO_UTILITY_CHAT_KEY = "fui_demo_utility_chat";

export function loadDemoUtilityChatMessages(): DemoUtilityChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FUI_DEMO_UTILITY_CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DemoUtilityChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDemoUtilityChatMessages(messages: DemoUtilityChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FUI_DEMO_UTILITY_CHAT_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }
}

export function persistDemoUtilityChatSnapshot(messages: DemoUtilityChatMessage[]): void {
  saveDemoUtilityChatMessages(messages);
}
