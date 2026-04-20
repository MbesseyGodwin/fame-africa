import { BrevoClient } from "@getbrevo/brevo";
import { logger } from "./logger";

/**
 * Brevo Transactional Email Client (v5 SDK)
 */
const BREVO_API_KEY = process.env.BREVO_API_KEY;

let brevoClient: BrevoClient | null = null;

if (!BREVO_API_KEY) {
  logger.warn("BREVO_API_KEY not found in environment. Email sending will fail.");
} else {
  brevoClient = new BrevoClient({
    apiKey: BREVO_API_KEY,
  });
  logger.info("Email transporter initialized ✓ (Brevo Client v5)");
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Recipient = string | { email: string; name?: string };

interface Attachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

interface MailOptions {
  to: Recipient | Recipient[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;  // optional override — defaults to BREVO_EMAIL_FROM
  replyTo?: string;
  cc?: Recipient | Recipient[] | string;
  bcc?: Recipient | Recipient[] | string;
  attachments?: Attachment[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise any recipient shape to Brevo's [{ email, name? }] array */
function normalizeRecipients(
  raw: Recipient | Recipient[] | string | undefined
): { email: string; name?: string }[] | undefined {
  if (!raw) return undefined;

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((email) => ({ email }));
  }

  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.map((r) => (typeof r === "string" ? { email: r } : r));
}

/** Strip HTML tags → plain-text fallback (Brevo requires non-empty textContent) */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Core send ─────────────────────────────────────────────────────────────────

async function sendMail(options: MailOptions): Promise<any> {
  if (!brevoClient) {
    throw new Error("Brevo client not initialized. Check your BREVO_API_KEY.");
  }

  // ── Sender ────────────────────────────────────────────────────────────────
  const rawFrom = options.from || process.env.BREVO_EMAIL_FROM || "FameAfrica <noreply@fameafrica.fm>";
  const sender = typeof rawFrom === 'string' && rawFrom.includes('<') && rawFrom.includes('>')
    ? {
        name: rawFrom.split('<')[0].trim(),
        email: rawFrom.split('<')[1].replace('>', '').trim()
      }
    : { name: "FameAfrica", email: rawFrom };

  // ── Recipients ────────────────────────────────────────────────────────────
  const to = normalizeRecipients(options.to)!;
  const cc = normalizeRecipients(options.cc);
  const bcc = normalizeRecipients(options.bcc);

  // ── Content ───────────────────────────────────────────────────────────────
  const htmlContent = options.html;
  const textContent =
    options.text?.trim() ||
    (options.html
      ? htmlToPlainText(options.html)
      : "Please view this email in an HTML-compatible client.");

  // ── Attachments ───────────────────────────────────────────────────────────
  const attachment = options.attachments?.map((a) => ({
    name: a.filename,
    content: Buffer.isBuffer(a.content)
      ? a.content.toString("base64")
      : Buffer.from(a.content as string).toString("base64"),
  }));

  // ── Send ──────────────────────────────────────────────────────────────────
  try {
    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      sender,
      to,
      cc,
      bcc,
      subject: options.subject,
      htmlContent,
      textContent,
      replyTo: options.replyTo ? { email: options.replyTo } : undefined,
      attachment,
    });

    logger.info("✓ Brevo email sent", {
      messageId: (response as any)?.messageId,
      to: to.map((t) => t.email).join(", "),
      subject: options.subject,
    });

    return response;
  } catch (err: any) {
    logger.error("✗ Brevo send failed", {
      message: err.message,
      brevoMessage: err.response?.body?.message || err.response?.data?.message || err.message,
    });
    throw err;
  }
}

export const emailTransporter = { sendMail };
