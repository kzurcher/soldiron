import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

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
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(
        "id, listing_id, listing_title, seller_name, seller_email, sender_name, sender_phone, sender_email, message, created_at"
      )
      .order("created_at", { ascending: false });

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    const messageRows = messages ?? [];
    if (messageRows.length === 0) return [];

    const messageIds = messageRows.map((message) => message.id);
    const { data: replies, error: repliesError } = await supabase
      .from("message_replies")
      .select("id, message_id, seller_email, reply, created_at")
      .in("message_id", messageIds)
      .order("created_at", { ascending: false });

    if (repliesError) {
      throw new Error(repliesError.message);
    }

    const repliesByMessageId = new Map<string, MessageReply[]>();
    for (const reply of replies ?? []) {
      const current = repliesByMessageId.get(reply.message_id) ?? [];
      current.push({
        id: reply.id,
        sellerEmail: reply.seller_email,
        reply: reply.reply,
        createdAt: reply.created_at,
      });
      repliesByMessageId.set(reply.message_id, current);
    }

    return messageRows.map((message) => ({
      id: message.id,
      listingId: message.listing_id,
      listingTitle: message.listing_title,
      sellerName: message.seller_name ?? "",
      sellerEmail: message.seller_email,
      senderName: message.sender_name,
      senderPhone: message.sender_phone,
      senderEmail: message.sender_email ?? "",
      message: message.message,
      createdAt: message.created_at,
      replies: repliesByMessageId.get(message.id) ?? [],
    }));
  }

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
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("messages")
      .insert({
        listing_id: payload.listingId,
        listing_title: payload.listingTitle,
        seller_name: payload.sellerName || null,
        seller_email: payload.sellerEmail.trim().toLowerCase(),
        sender_name: payload.senderName,
        sender_phone: payload.senderPhone,
        sender_email: payload.senderEmail || null,
        message: payload.message,
      })
      .select(
        "id, listing_id, listing_title, seller_name, seller_email, sender_name, sender_phone, sender_email, message, created_at"
      )
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not save message.");
    }

    return {
      id: data.id,
      listingId: data.listing_id,
      listingTitle: data.listing_title,
      sellerName: data.seller_name ?? "",
      sellerEmail: data.seller_email,
      senderName: data.sender_name,
      senderPhone: data.sender_phone,
      senderEmail: data.sender_email ?? "",
      message: data.message,
      createdAt: data.created_at,
      replies: [],
    };
  }

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
  if (isSupabaseConfigured()) {
    const existing = await getMessageForSellerById(input.messageId, input.sellerEmail);
    if (!existing) return { ok: false, error: "message_not_found" };

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("message_replies")
      .insert({
        message_id: input.messageId,
        seller_email: input.sellerEmail.trim().toLowerCase(),
        reply: input.reply.trim(),
      })
      .select("id, seller_email, reply, created_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not save message reply.");
    }

    const updatedMessage = await getMessageForSellerById(input.messageId, input.sellerEmail);
    return {
      ok: true,
      message: updatedMessage ?? existing,
      reply: {
        id: data.id,
        sellerEmail: data.seller_email,
        reply: data.reply,
        createdAt: data.created_at,
      },
    };
  }

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
