import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function sendTestMail() {
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SMTP connection successful");

    await transporter.sendMail({
      from: `"Mentor Feedback" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: "Test Email from Node.js",
      text: "This is a test email 🚀",
    });

    console.log("✅ Test email sent!");
  } catch (err) {
    console.error("❌ Error sending test email:", err);
  }
}

sendTestMail();
