import { db } from "@/db";
import { enquiries } from "@/db/schema";
import { clientIp, hit, pruneEvents, rateKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const PER_IP_PER_HOUR = 5;
const SITE_WIDE_PER_HOUR = 100;

const LIMITS = { name: 120, email: 200, company: 160, service: 80, budget: 40, message: 5000 };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function field(body: Record<string, unknown>, key: keyof typeof LIMITS): string {
  const v = body[key];
  return typeof v === "string" ? v.trim().slice(0, LIMITS[key]) : "";
}

/* Emails the owner about a new enquiry via Resend (https://resend.com), if
   configured. Plain text only, so nothing a visitor types is rendered as HTML.
   Best effort: the enquiry is already saved, so a failed email loses nothing. */
async function notify(e: {
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  message: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!key || !to) return;
  const from = process.env.CONTACT_FROM_EMAIL || "R208 Website <onboarding@resend.dev>";
  const text = [
    `Name: ${e.name}`,
    `Email: ${e.email}`,
    `Company: ${e.company || "-"}`,
    `Service: ${e.service || "-"}`,
    `Budget: ${e.budget || "-"}`,
    "",
    e.message,
    "",
    "— Also saved in the CMS under Enquiries.",
  ].join("\n");
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: e.email,
        subject: `New enquiry: ${e.name.replace(/[\r\n]+/g, " ")}`,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[r208] Enquiry email failed:", res.status, await res.text());
  } catch (err) {
    console.error("[r208] Enquiry email failed:", err);
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: a field hidden from people that bots tend to fill in.
  // Pretend it worked so the bot moves on.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return Response.json({ ok: true });
  }

  const e = {
    name: field(body, "name"),
    email: field(body, "email"),
    company: field(body, "company"),
    service: field(body, "service"),
    budget: field(body, "budget"),
    message: field(body, "message"),
  };
  if (!e.name || !EMAIL_RE.test(e.email) || !e.message) {
    return Response.json(
      { error: "Please fill in your name, a valid email and a message." },
      { status: 400 }
    );
  }

  const ip = clientIp(req);
  try {
    const perIp = await hit("contact", rateKey(ip), 60);
    if (perIp.count > PER_IP_PER_HOUR) {
      return Response.json(
        { error: "Too many messages from your connection. Please email us directly." },
        { status: 429 }
      );
    }
    const siteWide = await hit("contact-all", "*", 60);
    if (siteWide.count > SITE_WIDE_PER_HOUR) {
      return Response.json(
        { error: "We're receiving a lot of messages right now. Please email us directly." },
        { status: 429 }
      );
    }
    await db.insert(enquiries).values({ ...e, ip });
    await pruneEvents();
  } catch (err) {
    console.error("[r208] Saving enquiry failed:", err);
    return Response.json(
      { error: "Something went wrong on our side. Please email us directly." },
      { status: 503 }
    );
  }

  await notify(e);
  return Response.json({ ok: true });
}
