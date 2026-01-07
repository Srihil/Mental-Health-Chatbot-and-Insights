import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import UserProfile from "../models/UserProfile.js";

const router = express.Router();

// POST /api/preferences/save
router.post("/save", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, value } = req.body;

    if (!["likes", "dislikes", "goals"].includes(type)) {
      return res.status(400).json({ message: "Invalid preference type" });
    }

    await UserProfile.findOneAndUpdate(
      { userId },
      { $addToSet: { [type]: value } }, // avoid duplicates
      { upsert: true, new: true }
    );

    res.status(200).json({ message: `${type} updated successfully` });
  } catch (err) {
    console.error("❌ Error saving preference:", err.message);
    res.status(500).json({ message: "Failed to save preference" });
  }
});

export default router;
