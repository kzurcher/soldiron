import { createHash } from "node:crypto";

type CloudinaryUploadResult = {
  secure_url?: string;
  error?: { message?: string };
};

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "soldiron/listings";
  return { cloudName, apiKey, apiSecret, folder };
}

function createSignature(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const { cloudName, apiKey, apiSecret, folder } = getCloudinaryConfig();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("cloudinary_not_configured");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createSignature({ folder, timestamp }, apiSecret);

  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = new Blob([buffer], { type: file.type || "application/octet-stream" });

  const form = new FormData();
  form.append("file", blob, file.name || "upload.jpg");
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder", folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const result = (await response.json()) as CloudinaryUploadResult;
  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message ?? "cloudinary_upload_failed");
  }
  return result.secure_url;
}
