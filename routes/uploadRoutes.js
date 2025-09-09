// backend/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import { processExcelFiles } from "../utils/excel.js";

const router = express.Router();

// 📂 Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

// 📌 Upload + Process Route
router.post(
  "/",
  upload.fields([
    { name: "feedbackFile", maxCount: 1 }, // ✅ must match frontend
    { name: "mentorFile", maxCount: 1 },   // ✅ must match frontend
  ]),
  (req, res) => {
    try {
      if (!req.files.feedbackFile || !req.files.mentorFile) {
        return res.status(400).json({ error: "Both files are required" });
      }

      const feedbackPath = path.resolve(req.files.feedbackFile[0].path);
      const mentorPath = path.resolve(req.files.mentorFile[0].path);

      const summary = processExcelFiles(feedbackPath, mentorPath);

      res.json(summary);
    } catch (err) {
      console.error("❌ Upload processing failed:", err);
      res.status(500).json({ error: "Error processing files" });
    }
  }
);

export default router;
