import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type MessageInput = {
  listingId: string;
  listingTitle: string;
  sellerName: string;
  sellerEmail: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  message: string;
};

type StoredMessage = MessageInput & {
  id: string;
  createdAt: string;
};

declare global {
  var soldironMessageCache: StoredMessage[] | undefined;
}

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "messages.json");

async function readMessages(): Promise<StoredMessage[]> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return globalThis.soldironMessageCache ?? [];
  }
}

export async function getMessagesForSeller(sellerEmail: string): Promise<StoredMessage[]> {
  const normalized = sellerEmail.trim().toLowerCase();
  if (!normalized) return [];
  const messages = await readMessages();
  return messages.filter((message) => message.sellerEmail.toLowerCase() === normalized);
}

export async function saveMessage(payload: MessageInput): Promise<StoredMessage> {
  const current = await readMessages();
  const record: StoredMessage = {
    ...payload,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };

  current.unshift(record);
  globalThis.soldironMessageCache = current;

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dbPath, JSON.stringify(current, null, 2), "utf8");
  } catch {
    // Read-only serverless fallback.
  }

  return record;
}
