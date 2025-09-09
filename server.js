import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

import uploadRoutes from "./routes/uploadRoutes.js";
import mailRoutes, { transporter } from "./routes/mailRoutes.js";

// ✅ Load .env before anything else
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// 🔎 Debugging (log once on startup, not in production)
console.log("SMTP_USER:", process.env.SMTP_USER || "❌ MISSING");
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "✅ LOADED" : "❌ MISSING");
console.log("MONGO_URI:", MONGO_URI ? "✅ LOADED" : "❌ MISSING");

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // ✅ Fix PayloadTooLargeError
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/mail", mailRoutes);

app.post("/api/send-mail-individual", async (req, res) => {
  const mentor = req.body
  console.log(mentor.email)
  const date = new Date(); 
  const now = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const thisMonth = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const monthName = now.toLocaleString("en-US", { month: "short" }); // e.g., Jan, Feb
  const nextMonthDate = new Date(now);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonth = nextMonthDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  try {
    // Rating remark
    let remark = "";
    const avg = Number(mentor.avgRating);
    if (avg >= 4.6) {
      remark = `<span style="background-color:#4caf50; color:white; padding:2px 6px; border-radius:4px;">Excellent!</span>`;
    } else if (avg === 4.5) {
      remark = `<span style="background-color:#2196f3; color:white; padding:2px 6px; border-radius:4px;">Good</span>`;
    } else{
      remark = `<span style="background-color:#ff9800; color:white; padding:2px 6px; border-radius:4px;">Needs Immediate Attention</span>`;
    }

    // Feedback rows
    const feedbackRows = (mentor.feedbacks || [])
      .map((fb) => {
        const batch = fb.batch && fb.batch.trim() !== "" ? fb.batch : "N/A";
        let likeMost = fb.like;

        return `
          <tr>
            <td>${batch}</td>
            <td>${fb.rating || "-"}</td>
            <td>${likeMost}</td>
            <td>${fb.likedAboutTraining || "-"}</td>
            <td>${fb.suggestion || "-"}</td>
          </tr>`;
      })
      .join("");

    // HTML mail body
    const htmlBody = `
      <p>Hi <b>${mentor.name}</b>,</p>
      <p>Please find below the summary of the feedback analysis for the month of <b>${thisMonth}</b>.</p>

      <p><b>Your Feedback Count for ${monthName}:</b> ${
      mentor.feedbackCount
    }<br/>
      <b>Your Feedback Rating:</b> ${mentor.avgRating} | ${remark}</p>

      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%;">
        <thead style="background:skyblue; color:black;">
          <tr>
            <th>Batch</th>
            <th>Rating</th>
            <th style="width:30%;">Feedbacks</th>
            <th style="width:30%;">	What they like the most</th>
            <th style="width:30%;">	Any suggestions to improve the training ?</th>
          </tr>
        </thead>
        <tbody>
          ${
            feedbackRows ||
            "<tr><td colspan='4'>No detailed feedback available</td></tr>"
          }
        </tbody>
      </table>

      <p>Do work on the improvement areas and aim to ${avg >= 4.6 ?"maintain the same rating for" : "maintain above 4.6 rating for"} <b>${nextMonth}</b>.</p>
      <p><b>Address all the suggestions after sitting with the team and give proper reply to learners in class.</b></p>

      <br/>
      <p>Thanks & Regards,<br/>
      <b>Shivapriya M</b><br/>
      Instructional Designer<br/>
      ENTRI</p>
    `;

    console.log(mentor.cc.split(","))

    await transporter.sendMail({
      from: `"Mentor Feedback" <${process.env.SMTP_USER}>`,
      to: "bnidheesh844@gmail.com",
      subject: `📊 Monthly Feedback Summary - ${mentor.name} (${thisMonth})`,
      text: `Hi ${mentor.name},\n\nFeedback Count: ${mentor.feedbackCount}\nFeedback Rating: ${mentor.avgRating}\nCourse: ${mentor.course}\n\n(Open in HTML mail for detailed table)\n`,
      html: htmlBody,
    });

    console.log(`✅ Email sent to ${mentor.name} (${mentor.email})`);
    res.send("Success")
  } catch (err) {
    console.error(
      `❌ Failed to send email to ${mentor.name} (${mentor.email}):`,
      err.message
    );
    res.status(400).send("Error")
  }
});

// ✅ MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err.message));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
