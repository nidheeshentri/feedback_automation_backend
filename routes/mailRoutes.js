// backend/routes/mailRoutes.js
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Safe debug logs
console.log("DEBUG SMTP_USER loaded:", !!process.env.SMTP_USER);
console.log("DEBUG SMTP_PASS loaded:", !!process.env.SMTP_PASS);

// Gmail transporter
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP connection error:", error);
  } else {
    console.log("✅ Gmail SMTP is ready to send emails");
  }
});

// Main mail route
router.post("/", async (req, res) => {
  try {
    console.log("📩 Incoming mail request:", req.body);
    const { mentors, coordinatorEmail } = req.body;

    if (!mentors || !Array.isArray(mentors) || mentors.length === 0) {
      return res.status(400).json({ message: "Invalid or empty mentors data" });
    }

    // Dynamic Month-Year
    const now = new Date();
    const thisMonth = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    const monthName = now.toLocaleString("en-US", { month: "short" }); // e.g., Jan, Feb
    const nextMonthDate = new Date(now);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

    // Send emails in parallel
    await Promise.all(
      mentors.map(async (mentor) => {
        try {
          // Rating remark
          let remark = "";
          const avg = Number(mentor.avgRating);
          if (avg >= 4.5) {
            remark = `<span style="background-color:#4caf50; color:white; padding:2px 6px; border-radius:4px;">Outstanding!</span>`;
          } else if (avg >= 3.5) {
            remark = `<span style="background-color:#2196f3; color:white; padding:2px 6px; border-radius:4px;">Good</span>`;
          } else if (avg >= 2.5) {
            remark = `<span style="background-color:#ff9800; color:white; padding:2px 6px; border-radius:4px;">Needs Improvement</span>`;
          } else {
            remark = `<span style="background-color:#f44336; color:white; padding:2px 6px; border-radius:4px;">Critical</span>`;
          }

          // Feedback rows
          const feedbackRows = (mentor.feedbacks || [])
            .map(fb => {
              const batch = fb.batch && fb.batch.trim() !== "" ? fb.batch : "N/A";
              let likeMost = "-";
              if (fb.likeMost && fb.likeMost.trim() !== "") {
                likeMost = fb.likeMost;
              } else if (fb.suggestion && fb.suggestion.trim() !== "") {
                likeMost = "Liked course, but has suggestions";
              } else if (fb.rating >= 4) {
                likeMost = "Liked course overall";
              } else {
                likeMost = "No specific likes";
              }

              return `
                <tr>
                  <td>${batch}</td>
                  <td>${fb.rating || "-"}</td>
                  <td>${likeMost}</td>
                  <td>${fb.suggestion || "-"}</td>
                </tr>`;
            })
            .join("");

          // HTML mail body
          const htmlBody = `
            <p>Hi <b>${mentor.name}</b>,</p>
            <p>Please find below the summary of the feedback analysis for the month of <b>${thisMonth}</b>.</p>

            <p><b>Your Feedback Count for ${monthName}:</b> ${mentor.feedbackCount}<br/>
            <b>Your Feedback Rating:</b> ${mentor.avgRating} | ${remark}</p>

            <p><b>Course:</b> ${mentor.course}</p>

            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%;">
              <thead style="background:skyblue; color:black;">
                <tr>
                  <th>Batch</th>
                  <th>Rating</th>
                  <th style="width:30%;">What they like the most</th>
                  <th style="width:30%;">Suggestions to improve</th>
                </tr>
              </thead>
              <tbody>
                ${feedbackRows || "<tr><td colspan='4'>No detailed feedback available</td></tr>"}
              </tbody>
            </table>

            <p>Do work on the improvement areas, and aim to maintain the same rating for <b>${nextMonth}</b>.</p>
            <p><b>Address all the suggestions after sitting with the team and give proper reply to learners in class.</b></p>

            <p><span style="background-color:#4caf50; color:white; padding:2px 4px; border-radius:3px;">Green: Excellent Job!</span></p>
            <p><span style="background-color:#f44336; color:white; padding:2px 4px; border-radius:3px;">Red: Immediate Attention. Critical!</span></p>

            <br/>
            <p>Thanks & Regards,<br/>
            <b>Shivapriya M</b><br/>
            Instructional Designer<br/>
            ENTRI</p>
          `;

          await transporter.sendMail({
            from: `"Mentor Feedback" <${process.env.SMTP_USER}>`,
            to: mentor.email,
            subject: `📊 Monthly Feedback Summary - ${mentor.name} (${thisMonth})`,
            text: `Hi ${mentor.name},\n\nFeedback Count: ${mentor.feedbackCount}\nFeedback Rating: ${mentor.avgRating}\nCourse: ${mentor.course}\n\n(Open in HTML mail for detailed table)\n`,
            html: htmlBody,
          });

          console.log(`✅ Email sent to ${mentor.name} (${mentor.email})`);
        } catch (err) {
          console.error(`❌ Failed to send email to ${mentor.name} (${mentor.email}):`, err.message);
        }
      })
    );

    // Coordinator summary
    if (coordinatorEmail) {
      const summaryText = mentors
        .map(m => `${m.name} (${m.course}) => ${m.feedbackCount} feedback(s), Avg Rating: ${m.avgRating}`)
        .join("\n");

      try {
        await transporter.sendMail({
          from: `"Mentor Feedback" <${process.env.SMTP_USER}>`,
          to: coordinatorEmail,
          subject: `Mentor Feedback Summary Report - ${thisMonth}`,
          text: `📊 Here is the summary of all mentors for ${thisMonth}:\n\n${summaryText}`,
        });
        console.log(`✅ Coordinator email sent to ${coordinatorEmail}`);
      } catch (err) {
        console.error(`❌ Failed to send coordinator email:`, err.message);
      }
    }

    res.json({ ok: true, message: "✅ Emails sent successfully" });
  } catch (e) {
    console.error("❌ Mail route error:", e);
    res.status(500).json({ message: "Mail failed", error: e.message });
  }
});

export default router;
