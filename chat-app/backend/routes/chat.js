import express from "express";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// DELETE /api/chat/:userId/:receiverId
// DELETE 
router.delete("/:userId/:messageId", verifyToken, async (req, res) => {
  try {
    const { userId, messageId } = req.params;

    const chat = await Chat.findOne({ userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // ✅ Only delete the chat with the exact messageId
    chat.chatsData = chat.chatsData.filter((c) => c.messageId !== messageId);
    await chat.save();

    res.status(200).json({ message: "Chat deleted" });
  } catch (err) {
    console.error("❌ Delete failed:", err.message);
    res.status(500).json({ message: "Delete failed" });
  }
});


// POST /api/chat/create
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { userId, receiverId, customMessageId } = req.body;

    const ids = [userId, receiverId].sort();
    const messageId = customMessageId || `${ids[0]}_${ids[1]}`;

    // 🔥 Prevent default MindEase Bot chat
    // Block only the default "userId_bot" messageId
if (receiverId === "bot" && messageId === `${userId}_bot`) {
  return res.status(400).json({ message: "Default bot chat not allowed" });
}


    let senderChat = await Chat.findOne({ userId });
    if (!senderChat) senderChat = new Chat({ userId, chatsData: [] });

    const existsForSender = senderChat.chatsData.some(c => c.messageId === messageId);
    if (!existsForSender) {
      senderChat.chatsData.push({
        messageId,
        rId: receiverId,
        lastMessage: "",
        updatedAt: Date.now(),
        messageSeen: true,
      });
    }

    if (receiverId === "bot") {
      await senderChat.save();
      return res.status(200).json({ messageId }); // 🔥 No global check here
    }

    let receiverChat = await Chat.findOne({ userId: receiverId });
    if (!receiverChat) receiverChat = new Chat({ userId: receiverId, chatsData: [] });

    const existsForReceiver = receiverChat.chatsData.some(c => c.messageId === messageId);
    if (!existsForReceiver) {
      receiverChat.chatsData.push({
        messageId,
        rId: userId,
        lastMessage: "",
        updatedAt: Date.now(),
        messageSeen: false,
      });
    }

    await senderChat.save();
    await receiverChat.save();

    res.status(200).json({ messageId });
  } catch (err) {
    console.error("❌ Chat create error:", err);
    res.status(500).json({ message: "Chat creation failed" });
  }
});




// GET /api/chat/:id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({ userId: req.params.id });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const uniqueChatsMap = new Map();

    chat.chatsData.forEach((item) => {
      if (!uniqueChatsMap.has(item.messageId)) {
        uniqueChatsMap.set(item.messageId, item);
      }
    });

    const detailed = await Promise.all(
      Array.from(uniqueChatsMap.values()).map(async (item) => {
        let userData = null;

        if (item.rId === "bot") {
          userData = {
            _id: "bot",
            name: "MindEase Bot",
            isBot: true,
            avatar: "/assets/bot_avatar.png",
          };
        } else if (/^[0-9a-fA-F]{24}$/.test(item.rId)) {
          try {
            userData = await User.findById(item.rId).lean();
          } catch (err) {
            console.warn(`⚠️ Failed to load user ${item.rId}:`, err.message);
          }
        }

        return { ...(item.toObject?.() ?? item), userData };
      })
    );

    res.json({ chats: detailed });
  } catch (err) {
    console.error("❌ Error in GET /chat/:id", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
