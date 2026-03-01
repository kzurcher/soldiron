import nodemailer from "nodemailer";

function getEmailConfig() {
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  const fromAddress = process.env.SMTP_FROM_EMAIL ?? user;
  const fromName = process.env.SMTP_FROM_NAME ?? "Sold Iron Notifications";
  const secure = String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
  return { host, port, user, pass, fromAddress, fromName, secure };
}

export function isEmailConfigured(): boolean {
  const { host, port, user, pass, fromAddress } = getEmailConfig();
  return Boolean(host && port && user && pass && fromAddress);
}

export async function sendEmailNotification(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { host, port, user, pass, fromAddress, fromName, secure } = getEmailConfig();
  if (!host || !user || !pass || !fromAddress) return { ok: false, error: "smtp_not_configured" };

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: {
        name: fromName,
        address: fromAddress,
      },
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "email_send_failed",
    };
  }
}
