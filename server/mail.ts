// server/mail.ts
import dotenv from "dotenv";
dotenv.config();

import pkg from "nodemailer";
const nodemailer = pkg as typeof import("nodemailer");

const {
  SMTP_HOST, SMTP_PORT, SMTP_SECURE,
  SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO,
  SITE_PHONE
} = process.env;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT ? Number(SMTP_PORT) : 587,
  secure: SMTP_SECURE === "true",
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export async function verifyMail() {
  try {
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      await transporter.verify();
      console.log("[mail] SMTP verified");
    } else {
      console.log("[mail] SMTP not fully configured - skipping verify");
    }
  } catch (err) {
    console.error("[mail] SMTP verify failed:", err);
  }
}
 
/**
 * NOTE: image URL uses your uploaded file path which will be transformed by your environment:
 * /mnt/data/809fedcf-e4e3-401c-a6a9-57e0c55c4900.png
 */
const LOGO_URL = "https://shreekrishnafabrication.in/skf-krishna-logo-2.png";

/* ---------------- Admin notification ---------------- */
export async function sendContactMail(submission: {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  submittedAt?: Date | string;
}) {
  if (!EMAIL_TO) {
    console.warn("[mail] EMAIL_TO not set; skipping admin email");
    return;
  }

  const html = adminHtml(submission);
  const text = adminPlain(submission);

  return transporter.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: `New contact — ${submission.name} (${submission.service ?? "General"})`,
    text,
    html,
  });
}

function adminHtml(s: any) {
  // theme: dark header (#0f172a), warm orange accent (#f59e0b)
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>New Contact</title>
  </head>
  <body style="margin:0;background:#0b0b0b;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0b;padding:28px 12px;">
      <tr><td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0f172a;padding:18px 20px;color:#fff;">
              <table width="100%"><tr>
                <td style="vertical-align:middle;">
                  <img src="${LOGO_URL}" alt="Shree Krishna Fabrication" width="72" style="display:block;border-radius:6px;"/>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <div style="font-weight:800;font-size:18px;letter-spacing:0.2px;">SHREE KRISHNA FABRICATION</div>
                  <div style="font-size:12px;color:#f3f4f6;opacity:0.85;margin-top:4px;">Premium Fabrication — New Contact</div>
                </td>
              </tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px;background:#0b0b0b;color:#e6eef5;">
              <p style="margin:0 0 12px;font-size:15px;color:#e6eef5;">
                A new contact submission arrived via the website. Details below.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                <tr>
                  <td style="padding:12px;border-radius:8px;background:#0f172a;border:1px solid rgba(255,255,255,0.03);">
                    <strong style="display:block;font-size:13px;color:#f3f4f6;">Name</strong>
                    <div style="font-size:15px;color:#fff;margin-top:6px;">${escape(s.name)}</div>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="padding:12px;border-radius:8px;background:#0f172a;border:1px solid rgba(255,255,255,0.03);">
                    <strong style="display:block;font-size:13px;color:#f3f4f6;">Email</strong>
                    <div style="font-size:15px;color:#fff;margin-top:6px;">${escape(s.email)}</div>
                  </td>
                </tr>
              </table>

              <div style="height:12px;"></div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px;border-radius:8px;background:#111827;border:1px solid #1f2937;">
                    <strong style="display:block;font-size:13px;color:#f59e0b;">Service</strong>
                    <div style="font-size:14px;color:#f59e0b;margin-top:6px;">${escape(s.service ?? "—")}</div>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="padding:12px;border-radius:8px;background:#111827;border:1px solid #1f2937;">
                    <strong style="display:block;font-size:13px;color:#cbd5e1;">Phone</strong>
                    <div style="font-size:14px;color:#e6eef5;margin-top:6px;">${escape(s.phone ?? "—")}</div>
                  </td>
                </tr>
              </table>

              <div style="height:14px;"></div>

              <div style="padding:14px;background:#0b1220;border-radius:8px;border:1px solid #0d1724;color:#d1d5db;">
                <strong style="display:block;margin-bottom:8px;color:#fff;">Message</strong>
                <div style="line-height:1.5;color:#cbd5e1;">${nl2br(escape(s.message))}</div>
              </div>

              <p style="margin:14px 0 0;font-size:12px;color:#9ca3af;">Submitted: ${s.submittedAt ?? new Date()}</p>

              <div style="margin-top:18px;display:flex;gap:10px;">
                <a href="#" style="background:#f59e0b;color:#0b0b0b;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:600;">Open Admin</a>
                <a href="mailto:${escape(s.email)}" style="background:transparent;border:1px solid rgba(255,255,255,0.06);color:#e6eef5;padding:10px 14px;border-radius:8px;text-decoration:none;">Reply to sender</a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#0f172a;padding:12px 20px;color:#cbd5e1;font-size:12px;text-align:center;">
              © ${new Date().getFullYear()} Shree Krishna Fabrication — Premium Fabrication in Surat
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

function adminPlain(s: any) {
  return `New contact submission
Name: ${s.name}
Email: ${s.email}
Phone: ${s.phone ?? "-"}
Service: ${s.service ?? "-"}
Message:
${s.message}

Submitted at: ${s.submittedAt ?? new Date()}

-- Shree Krishna Fabrication`;
}

/* ---------------- Auto-reply (user) ---------------- */
// Replace existing sendAutoReply, userHtml, userPlain with this improved version:

export async function sendAutoReply(submission: any) {
  if (!submission?.email) return;
  const html = userHtmlImproved(submission);
  const text = userPlainImproved(submission);
  return transporter.sendMail({
    from: EMAIL_FROM,
    to: submission.email,
    subject: `Thanks — We received your request`,
    text,
    html,
  });
}

function userHtmlImproved(sub: any) {
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Thanks from Shree Krishna Fabrication</title>
  </head>
  <body style="margin:0;background:#0b0b0b;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px; background:#f3f4f6;">
      <tr><td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(2,6,23,0.35);">
          
          <!-- top banner with logo -->
          <tr>
            <td style="background:linear-gradient(90deg,#0f172a,#0b1220);padding:20px 22px;color:#fff;">
              <table width="100%"><tr>
                <td style="vertical-align:middle;">
                  <img src="${LOGO_URL}" width="64" alt="Shree Krishna Fabrication" style="display:block;border-radius:6px;"/>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <div style="font-weight:800;font-size:16px;letter-spacing:0.6px;">SHREE KRISHNA FABRICATION</div>
                  <div style="font-size:12px;color:#cbd5e1;opacity:0.9;margin-top:4px;">Premium MS & SS Fabrication</div>
                </td>
              </tr></table>
            </td>
          </tr>

          <!-- hero -->
          <tr>
            <td style="padding:26px 28px 12px 28px; text-align:left; color:#0f172a;">
              <h2 style="margin:0 0 8px; font-size:20px; line-height:1.1;">Thanks, ${escape(sub.name)} — we got your request</h2>
              <p style="margin:0 0 14px; color:#374151; font-size:15px;">
                We’ve received your request for <strong>${escape(sub.service ?? "a project enquiry")}</strong>. Our team reviews requests quickly and will contact you within <strong>24–48 hours</strong>.
              </p>
            </td>
          </tr>


          <!-- CTA -->
          <tr>
            <td style="padding:6px 28px 20px 28px; text-align:center;">
              <a href="https://shreekrishnafabrication.in/portfolio" target="_blank"
                 style="display:inline-block;background:#f59e0b;color:#08121a;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700;">
                 View our portfolio
              </a>
            </td>
          </tr>

          <!-- small footer details -->
          <tr>
            <td style="padding:14px 22px 20px 22px; background:#f8fafc; text-align:center; font-size:13px; color:#475569;">
              <div style="margin-bottom:6px;">Need help now? Call: <strong>${escape(process.env.SITE_PHONE ?? "Phone number")}</strong></div>
              <div style="font-size:12px; color:#6b7280;">We reply Monday–Saturday: 9:00 AM — 7:00 PM. Avg response time: 24–48 hours.</div>
            </td>
          </tr>

          <tr>
            <td style="background:#0f172a;padding:12px;color:#cbd5e1;text-align:center;font-size:12px;">
              © ${new Date().getFullYear()} Shree Krishna Fabrication — Premium Fabrication in Surat
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;
}

function userPlainImproved(sub: any) {
  return `Thanks ${sub.name},

We received your request for ${sub.service ?? "a general enquiry"}. Our team will contact you within 24–48 hours.

If it's urgent, call: ${process.env.SITE_PHONE ?? "Phone number"}.

— Shree Krishna Fabrication`;
}

/* ---------------- helpers ---------------- */
function escape(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function nl2br(s: string) {
  return escape(s).replace(/\n/g, "<br/>");
}
