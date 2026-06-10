export type DemoUtilityChatMessage = {
  id: number;
  orderId: number;
  senderId: number;
  message: string;
  createdAt: string;
};

const messagesByOrder = new Map<number, DemoUtilityChatMessage[]>();
let nextMessageId = 1;

export function getDemoUtilityChatMessages(orderId: number): DemoUtilityChatMessage[] {
  return messagesByOrder.get(orderId) ?? [];
}

export function addDemoUtilityChatMessage(
  orderId: number,
  senderId: number,
  message: string
): DemoUtilityChatMessage {
  const entry: DemoUtilityChatMessage = {
    id: nextMessageId++,
    orderId,
    senderId,
    message,
    createdAt: new Date().toISOString(),
  };
  const list = messagesByOrder.get(orderId) ?? [];
  list.push(entry);
  messagesByOrder.set(orderId, list);
  return entry;
}

export function exportDemoUtilityChatMessages(): DemoUtilityChatMessage[] {
  return Array.from(messagesByOrder.values()).flat();
}

export function hydrateDemoUtilityChatMessages(messages: DemoUtilityChatMessage[]): void {
  messagesByOrder.clear();
  for (const msg of messages) {
    const list = messagesByOrder.get(msg.orderId) ?? [];
    list.push({ ...msg });
    messagesByOrder.set(msg.orderId, list);
    if (msg.id >= nextMessageId) nextMessageId = msg.id + 1;
  }
}

/** Apenas testes. */
export function resetDemoUtilityChatForTests(): void {
  messagesByOrder.clear();
  nextMessageId = 1;
}
