import express from "express";
import { getSummary, getMentorByName } from "../utils/excel.js";

const router = express.Router();

// Get all mentors summary
router.get("/", (req, res) => {
  const summaries = getSummary();
  res.json(summaries || []);
});

// Get one mentor details
router.get("/mentor/:name", (req, res) => {
  try {
    const { name } = req.params;
    const mentor = getMentorByName(name);

    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json(mentor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
