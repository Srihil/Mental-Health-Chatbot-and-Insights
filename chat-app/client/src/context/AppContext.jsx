import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "../config/api";
import assets from "../assets/assets";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [virtualBotChats, setVirtualBotChats] = useState([]);
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState([]);
  const [messagesId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatUserState, _setChatUser] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const botUser = {
    _id: "bot",
    name: "MindEase AI",
    isBot: true,
    avatar: assets.bot_avatar,
  };

  const setChatUser = (user) => {
    if (!user) return _setChatUser(null);

    if (user.rId === "bot" || user.userData?.isBot) {
      _setChatUser({
        ...user, 
        userData: botUser, 
      });
    }
    else {
      _setChatUser(user);
    }
  };

  const loadUserData = async () => {
    try {
      const res = await axios.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = res.data;
      setUserData(user);
      if (window.location.pathname === "/") {
        navigate(user.avatar && user.name ? "/chat" : "/profile");
      }
        
      await axios.put(
        `/auth/lastseen/${user._id}`,
        { lastSeen: Date.now() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const iv = setInterval(() => {
        axios.put(
          `/auth/lastseen/${user._id}`,
          { lastSeen: Date.now() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }, 60000);
      return () => clearInterval(iv);
    } catch (e) {
      toast.error("Failed to load user");
      navigate("/");
    }
  };

  const fetchChatData = async (uid) => {
    try {
      const res = await axios.get(`/chat/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // ❌ Remove raw bot chat from backend (not created via virtualBotChats)
      const chats = res.data.chats || [];
      const filteredChats = chats.filter((chat) => chat.rId !== "bot");
      setChatData(chats.sort((a, b) => b.updatedAt - a.updatedAt));

  
    } catch (e) {
      toast.error("Failed to fetch chat list");
    }
  };
  
  const updateLastMessage = (messageId, text) => {
    setChatData((prev) =>
      prev.map((chat) =>
        chat.messageId === messageId
          ? { ...chat, lastMessage: text, updatedAt: Date.now() }
          : chat
      )
    );
  };
  

  useEffect(() => {
    if (userData?._id) {
      fetchChatData(userData._id);
      const iv = setInterval(() => fetchChatData(userData._id), 10000);
      return () => clearInterval(iv);
    }
  }, [userData]);

  useEffect(() => {
    if (userData?._id) {
      const saved = JSON.parse(localStorage.getItem(`virtual_bot_chats_${userData._id}`) || "[]");
      setVirtualBotChats(saved);
    }
  }, [userData]);
  
  
return (
  <AppContext.Provider
    value={{
      userData,
      setUserData,
      loadUserData,
      chatData,
      setChatData, // ✅ ADD THIS LINE
      messagesId,
      setMessagesId,
      chatUser: chatUserState,
      setChatUser,
      chatVisible,
      setChatVisible,
      messages,
      setMessages,
      virtualBotChats,
      setVirtualBotChats, // 🔥 now globally available
      updateLastMessage, // ✅ ADD THIS LINE

    }}
  >

      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
