import React, { useContext, useEffect, useRef, useState } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import axios from "../../config/api";
import { toast } from "react-toastify";
import upload from "../../lib/upload";

const ChatBox = () => {
  const {
    userData,
    messagesId,
    chatUser,
    messages,
    setMessages,
    chatVisible,
    setChatVisible,
    loadUserData,
    setVirtualBotChats,
    updateLastMessage,
  } = useContext(AppContext);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollEnd = useRef();
  const token = localStorage.getItem("token");
  const activeChatIdRef = useRef(messagesId);

  useEffect(() => {
    activeChatIdRef.current = messagesId;

    if (!messagesId || !chatUser) return;

    if (chatUser.userData?.isBot) {
      const key = `${messagesId}_messages`;
      const storedBotMessages = JSON.parse(localStorage.getItem(key) || "[]");
      setMessages(storedBotMessages);
    } else {
      fetchMessages(messagesId);
    }
  }, [messagesId, chatUser]);

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const fetchMessages = async (id) => {
    try {
      const res = await axios.get(`/message/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages || []);
    } catch (err) {
      toast.error("Failed to load messages");
    }
  };

  const updateChatListLastMessage = (msg) => {
    const currentChatId = messagesId;

    if (chatUser?.userData?.isBot) {
      setVirtualBotChats((prev) => {
        const updated = prev.map((chat) =>
          chat.messageId === currentChatId
            ? {
                ...chat,
                lastMessage: msg.text || "[Image]",
                updatedAt: Date.now(),
              }
            : chat
        );

        localStorage.setItem("virtualBotChats", JSON.stringify(updated));

        return updated;
      });
    } else {
      updateLastMessage(currentChatId, msg.text || "[Image]"); // ✅ fix here
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = {
      senderId: userData._id,
      text: input,
    };

    const currentChatId = messagesId;

    const newMsg = {
      ...userMsg,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...prev, newMsg];
      if (chatUser?.userData?.isBot) {
        localStorage.setItem(
          `${currentChatId}_messages`,
          JSON.stringify(updated)
        );
      }
      return updated;
    });

    updateChatListLastMessage(newMsg); // ✅ update sidebar for user msg

    try {
      await axios.post(`/message/${currentChatId}`, userMsg, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInput("");
      setIsTyping(true);

      if (chatUser?.userData?.isBot) {
        const res = await axios.post(
          "http://localhost:5000/api/mental-health-chat",
          {
            message: userMsg.text,
            messageId: currentChatId, // ✅ ADD THIS
            instruction:
              "Reply in 1-2 short, helpful sentences. Use simple language a teen can understand.",
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { reply, mood, sentiment, confidence } = res.data;
        // AFTER – keeps max 1 emoji and 2 textual sentences
        const parts = reply
          .split(/(?<=[.?!])\s+/) // split on punctuation+space
          .filter(Boolean) // drop empty items
          .slice(0, 3); // keep max‑3 parts

        const sentences = [];
        for (const p of parts) {
          // collapse pure‑emoji “😊” / “🙂” etc. into one
          if (/^[\p{Emoji}\p{P}\s]+$/u.test(p)) {
            if (!sentences.some((s) => /^[\p{Emoji}]+$/u.test(s)))
              sentences.push("😊");
          } else {
            sentences.push(p.trim());
          }
        }

        for (let i = 0; i < sentences.length; i++) {
          const sentence = sentences[i];
          if (!sentence.trim()) continue;

          if (activeChatIdRef.current !== currentChatId) {
            console.log("⚠️ Skipping bot reply — chat switched");
            return;
          }

          const botMsg = {
            senderId: "bot",
            text: sentence,
            createdAt: new Date().toISOString(),
            mood,
            sentiment,
            confidence,
          };

          await axios.post(`/message/${currentChatId}`, botMsg, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setMessages((prev) => {
            const updated = [...prev, botMsg];
            localStorage.setItem(
              `${currentChatId}_messages`,
              JSON.stringify(updated)
            );
            return updated;
          });

          updateChatListLastMessage(botMsg); // ✅ always called

          await new Promise((res) => setTimeout(res, 800));
        }

        setIsTyping(false);
      } else {
        setIsTyping(false);
      }
    } catch (err) {
      toast.error("Message failed to send");
      setIsTyping(false);
    }
  };

  const sendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const currentChatId = messagesId;

    try {
      const imageUrl = await upload(file);
      const payload = {
        senderId: userData._id,
        image: imageUrl,
        createdAt: new Date().toISOString(),
      };

      await axios.post(`/message/${currentChatId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) => {
        const updated = [...prev, payload];
        if (chatUser?.userData?.isBot) {
          localStorage.setItem(
            `${currentChatId}_messages`,
            JSON.stringify(updated)
          );
        }
        updateChatListLastMessage(payload);
        return updated;
      });
    } catch (err) {
      toast.error("Image upload failed");
    }
  };

  const convertTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const getBotChatIndex = () => {
    if (!messagesId || !chatUser?.userData?.isBot) return null;
    const allBotChats = JSON.parse(
      localStorage.getItem(`virtual_bot_chats_${userData._id}`) || "[]"
    );
    const sortedChats = [...allBotChats].sort(
      (a, b) => a.updatedAt - b.updatedAt
    );
    const index = sortedChats.findIndex((c) => c.messageId === messagesId);
    return index >= 0 ? index + 1 : null;
  };

  return chatUser ? (
    <div className={`chat-box ${chatVisible ? "block" : "hidden md:block"}`}>
      <div className="chat-user">
        <img
          src={
            chatUser?.userData?.isBot
              ? assets.bot_avatar
              : chatUser.userData.avatar?.startsWith("/")
              ? `http://localhost:5000${chatUser.userData.avatar}`
              : chatUser?.userData?.avatar || assets.profile_img
          }
          alt="Avatar"
        />
        <p style={{ fontSize: " 1.5rem" }}>
          {chatUser?.title || chatUser?.userData?.name || "User"}
        </p>

        <img
          onClick={() => setChatVisible(false)}
          className="arrow"
          src={assets.arrow_icon}
          alt="Back"
        />
      </div>

      <div className="chat-msg">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.senderId === userData._id ? "s-msg" : "r-msg"}
          >
            {msg.image ? (
              <img className="msg-img" src={msg.image} alt="Sent" />
            ) : (
              <p className="msg">{msg.text}</p>
            )}
            <div>
              <img
                src={
                  msg.senderId === userData._id
                    ? userData.avatar?.startsWith("/")
                      ? `http://localhost:5000${userData.avatar}`
                      : userData.avatar
                    : chatUser?.userData?.isBot
                    ? assets.bot_avatar
                    : chatUser.userData.avatar?.startsWith("/")
                    ? `http://localhost:5000${chatUser.userData.avatar}`
                    : chatUser.userData.avatar
                }
                alt="Sender"
                style={{ objectFit: "cover" }}
              />
              <p style={{ fontSize: "10px" }}>
                {convertTimestamp(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}

        {isTyping && chatUser?.userData?.isBot && (
          <div className="r-msg">
            <p className="msg bot-typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </p>
            <div>
              <img
                src={assets.bot_avatar}
                alt="Bot"
                style={{ objectFit: "cover" }}
              />
              <p>Typing...</p>
            </div>
          </div>
        )}
        <div ref={scrollEnd}></div>
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Send a message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{ fontSize: " 1rem" }}
        />
        <input
          type="file"
          id="image"
          accept="image/png, image/jpeg"
          hidden
          onChange={sendImage}
        />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="Upload" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="Send" />
      </div>
    </div>
  ) : (
    <div className={`chat-welcome ${!chatVisible ? "" : "hidden"}`}>
      <img src={assets.logo_icon} alt="Welcome" />
      <p>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatBox;
