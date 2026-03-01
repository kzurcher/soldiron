type TwilioMessageResult = {
  sid?: string;
  error_message?: string | null;
};

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const fromPhone = process.env.TWILIO_FROM_PHONE ?? "";
  return { accountSid, authToken, fromPhone };
}

export function isTwilioConfigured(): boolean {
  const { accountSid, authToken, fromPhone } = getTwilioConfig();
  return Boolean(accountSid && authToken && fromPhone);
}

export async function sendTwilioSms(toPhone: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const { accountSid, authToken, fromPhone } = getTwilioConfig();
  if (!accountSid || !authToken || !fromPhone) {
    return { ok: false, error: "twilio_not_configured" };
  }

  const params = new URLSearchParams();
  params.set("To", toPhone);
  params.set("From", fromPhone);
  params.set("Body", body);

  const encoded = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const result = (await response.json()) as TwilioMessageResult;
  if (!response.ok) {
    return { ok: false, error: result.error_message ?? "twilio_send_failed" };
  }

  return { ok: true };
}
