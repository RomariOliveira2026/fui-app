export type DemoChatMessage = {
  id: number;
  rideId: number;
  senderId: number;
  message: string;
  createdAt: Date;
};

const demoChatByRide = new Map<number, DemoChatMessage[]>();
let nextMessageId = 1;

export function getDemoChatMessages(rideId: number): DemoChatMessage[] {
  return demoChatByRide.get(rideId) ?? [];
}

export function addDemoChatMessage(
  rideId: number,
  senderId: number,
  message: string
): DemoChatMessage {
  const entry: DemoChatMessage = {
    id: nextMessageId++,
    rideId,
    senderId,
    message,
    createdAt: new Date(),
  };
  const list = demoChatByRide.get(rideId) ?? [];
  list.push(entry);
  demoChatByRide.set(rideId, list);
  return entry;
}

export function hydrateDemoChatMessages(
  rideId: number,
  messages: Array<{ id?: number; senderId: number; message: string; createdAt: string | Date }>
): void {
  if (messages.length === 0) return;
  const parsed = messages.map((m) => ({
    id: m.id ?? nextMessageId++,
    rideId,
    senderId: m.senderId,
    message: m.message,
    createdAt: new Date(m.createdAt),
  }));
  for (const m of parsed) {
    if (m.id >= nextMessageId) nextMessageId = m.id + 1;
  }
  demoChatByRide.set(rideId, parsed);
}
