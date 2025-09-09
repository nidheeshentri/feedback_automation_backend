import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { buildEmailHTML } from "./template.js";

// ✅ load .env here too
dotenv.config();

console.log("DEBUG: SMTP_USER =", process.env.SMTP_USER || "(not set)");
console.log("DEBUG: SMTP_PASS exists?", !!process.env.SMTP_PASS);

function makeTransport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // ✅ Default: Gmail
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendMentorMails({ summaries, monthLabel }) {
  const transport = makeTransport();

  // Optional CCs
  const cc = [
    process.env.CORE_MENTOR_CC,
    process.env.SOFTSKILL_MENTOR_CC,
    process.env.COURSE_COORDINATOR_CC
  ].filter(Boolean);

  const results = [];
  for (const s of summaries) {
    if (!s.email) {
      results.push({
        mentor: s.mentor,
        status: "skipped",
        reason: "no email"
      });
      continue;
    }

    const html = buildEmailHTML({ ...s, monthLabel });

    const mail = {
      from: process.env.SMTP_USER,
      to: s.email,
      cc,
      subject: `[${s.course}] ${s.role?.toUpperCase() || "MENTOR"} Feedback Summary — ${monthLabel}`,
      html
    };

    try {
      const info = await transport.sendMail(mail);
      results.push({
        mentor: s.mentor,
        email: s.email,
        status: "sent",
        id: info.messageId
      });
    } catch (err) {
      results.push({
        mentor: s.mentor,
        email: s.email,
        status: "error",
        error: err.message
      });
    }
  }

  return results;
}
