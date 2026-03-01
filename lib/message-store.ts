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

export type MessageReply = {
  id: string;
  sellerEmail: string;
  reply: string;
  createdAt: string;
};

export type StoredMessage = MessageInput & {
  id: string;
  createdAt: string;
  replies: MessageReply[];
};

declare global {
  var soldironMessageCache: StoredMessage[] | undefined;
}

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "messages.json");

async function readMessages(): Promise<StoredMessage[]> {
  try {
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as Array<StoredMessage | (Omit<StoredMessage, "replies"> & { replies?: MessageReply[] })>;
    return parsed.map((message) => ({
      ...message,
      replies: message.replies ?? [],
    }));
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

export async function getMessageForSellerById(
  messageId: string,
  sellerEmail: string
): Promise<StoredMessage | null> {
  const normalizedEmail = sellerEmail.trim().toLowerCase();
  const normalizedId = messageId.trim();
  if (!normalizedId || !normalizedEmail) return null;
  const messages = await readMessages();
  const message = messages.find((item) => item.id === normalizedId);
  if (!message) return null;
  if (message.sellerEmail.toLowerCase() !== normalizedEmail) return null;
  return message;
}

export async function saveMessage(payload: MessageInput): Promise<StoredMessage> {
  const current = await readMessages();
  const record: StoredMessage = {
    ...payload,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    replies: [],
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

export async function saveMessageReply(input: {
  messageId: string;
  sellerEmail: string;
  reply: string;
}): Promise<{ ok: boolean; error?: string; message?: StoredMessage; reply?: MessageReply }> {
  const current = await readMessages();
  const normalizedSellerEmail = input.sellerEmail.trim().toLowerCase();
  const target = current.find((message) => message.id === input.messageId);

  if (!target) return { ok: false, error: "message_not_found" };
  if (target.sellerEmail.toLowerCase() !== normalizedSellerEmail) {
    return { ok: false, error: "forbidden" };
  }

  const reply: MessageReply = {
    id: randomUUID(),
    sellerEmail: normalizedSellerEmail,
    reply: input.reply.trim(),
    createdAt: new Date().toISOString(),
  };
  target.replies.unshift(reply);
  globalThis.soldironMessageCache = current;

  try {
    await mkdir(dataDir, { recursive: true });
    await writeFile(dbPath, JSON.stringify(current, null, 2), "utf8");
  } catch {
    // Read-only serverless fallback.
  }

  return { ok: true, message: target, reply };
}
