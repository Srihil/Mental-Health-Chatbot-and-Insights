import React, { useContext, useEffect, useRef, useState } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";
import axios from "../../config/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageSquare, BarChart2, User, LogOut } from "lucide-react";

const SERVER_BASE_URL = "http://localhost:5000";

// MenuToggle Component
const MenuToggle = ({ isOpen, toggle }) => {
  return (
    <button
      className="menu-toggle-btn"
      onClick={toggle}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      style={{
        position: "fixed",
        width: "40px",
      height: "40px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s",
      backgroundColor: "#001030",
      color: "white",
      border: "none",
      marginRight: "16px",
      top: "24px"
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isOpen ? "close" : "open"}
          initial={{ opacity: 0, rotate: isOpen ? -90 : 90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: isOpen ? 90 : -90 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
};

// MenuItem Component
const MenuItem = ({ icon, label, onClick = () => {} }) => {
  return (
    <button
      className="menu-item-btn"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "16px 24px",
        fontSize: "18px",
        backgroundColor: "transparent",
        border: "none",
        cursor: "pointer",
        borderRadius: "8px",
        transition: "background-color 0.2s",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#f1f5f9";
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "transparent";
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// SlidingMenu Component
const SlidingMenu = ({ isOpen, onClose, navigate }) => {
  const menuVariants = {
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  };

  const handleNavigation = (destination) => {
    onClose();
    navigate(`/${destination}`);
  };
  

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="menu-overlay"
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          />
          <motion.div
            className="sliding-menu"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 50,
              height: "100%",
              width: window.innerWidth < 400 ? "100vw" : "375px",
              backgroundColor: "white",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                height: "100%",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "24px", paddingTop: "0px" }}>
                <h2
                  style={{
                    marginBottom: "24px",
                    fontSize: "24px",
                    fontWeight: "bold",
                    zIndex: "100",
                  }}
                >
                  Menu
                </h2>
                <nav
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <MenuItem
                    icon={<MessageSquare size={24} />}
                    label="Chat"
                    onClick={() => handleNavigation("chat")}
                  />
                  <MenuItem
                    icon={<BarChart2 size={24} />}
                    label="Insights"
                    onClick={() => handleNavigation("insights")}
                  />
                  <MenuItem
                    icon={<User size={24} />}
                    label="Edit Profile"
                    onClick={() => handleNavigation("profile")}
                  />
                </nav>
              </div>
              <div style={{ marginTop: "auto", padding: "24px" }}>
                <MenuItem
                  icon={<LogOut size={24} />}
                  label="Log Out"
                  onClick={handleLogout}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const LeftSidebar = () => {
  const {
    chatData,
    setChatData,
    userData,
    setChatUser,
    setMessagesId,
    messagesId,
    setMessages,
    chatVisible,
    setChatVisible,
    loadUserData,
  } = useContext(AppContext);

  const [searchResult, setSearchResult] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { virtualBotChats, setVirtualBotChats } = useContext(AppContext);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const botUser = {
    _id: "bot",
    isBot: true,
    name: "MindEase AI",
    avatar: assets.bot_avatar,
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    if (userData?._id) {
      const saved = JSON.parse(
        localStorage.getItem(`virtual_bot_chats_${userData._id}`) || "[]"
      );
      setVirtualBotChats(saved);
    }
  }, [userData]);

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef(null);

  const inputHandler = (e) => {
    setSearchQuery(e.target.value.toLowerCase().trim());
  };

  const addChat = async () => {
    try {
      const ids = [userData._id, searchResult._id].sort();
      const fixedMessageId = `${ids[0]}_${ids[1]}`;

      const res = await axios.post(
        "/chat/create",
        { userId: userData._id, receiverId: searchResult._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newChatUser = {
        messageId: fixedMessageId,
        rId: searchResult._id,
        lastMessage: "",
        updatedAt: Date.now(),
        messageSeen: true,
        userData: searchResult,
      };

      setMessages([]);
      setMessagesId(fixedMessageId);
      setChatUser(newChatUser);
      setChatVisible(true);

      await loadUserData(userData);
      setShowSearch(false);
    } catch (err) {
      toast.error("Failed to start chat");
    }
  };

  const setChat = async (item) => {
    try {
      setMessages([]);

      setMessagesId(item.messageId);

      if (item.rId === "bot" || item.userData?.isBot) {
        const fullChat = {
          messageId: item.messageId,
          rId: item.rId,
          lastMessage: item.lastMessage,
          updatedAt: item.updatedAt,
          createdAt: item.createdAt,
          messageSeen: item.messageSeen,
          title: item.title,
          userData: { ...botUser },
        };

        setChatUser(fullChat);
      } else {
        const res = await axios.get(`/user/${item.rId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChatUser({ ...item, userData: res.data });
      }

      setChatVisible(true);
    } catch (err) {
      toast.error("Error loading chat");
    }
  };

  const deleteChat = async (rId) => {
    setDeletingId(rId);

    try {
      await axios.delete(`/chat/${userData._id}/${rId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages([]);
      setMessagesId(null);
      setChatUser(null);
      setChatVisible(false);
      setChatData((prev) => prev.filter((c) => c.rId !== rId));

      toast.success("Chat deleted");
    } catch (err) {
      console.error("Delete failed:", err.message);
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };



  const createNewBotChat = async () => {
    const timestamp = Date.now();
  
    // Create a fixed messageId per user-bot pair
    const newMessageId = `${userData._id}_bot_${timestamp}`;
    const key = `${newMessageId}_messages`;
  
    const usedNumbers = virtualBotChats.map((chat) => {
      const match = chat.title?.match(/AI Chat (\d+)/);
      return match ? parseInt(match[1], 10) : null;
    }).filter((n) => n !== null);
    const nextChatNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1;
  
    const newChat = {
      messageId: newMessageId,
      rId: "bot",
      lastMessage: "",
      updatedAt: timestamp,
      createdAt: timestamp,
      title: `AI Chat ${nextChatNumber}`,
      messageSeen: true,
      userData: { ...botUser },
    };
  
    try {
      // Save to backend with customMessageId
      await axios.post(
        "/chat/create",
        {
          userId: userData._id,
          receiverId: "bot",
          customMessageId: newMessageId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.warn("Bot chat may already exist in backend:", err.message);
    }
  
    localStorage.setItem(key, JSON.stringify([]));
  
    const updated = [newChat, ...virtualBotChats];
    setVirtualBotChats(updated);
    localStorage.setItem(
      `virtual_bot_chats_${userData._id}`,
      JSON.stringify(updated)
    );
  
    setMessages([]);
    setMessagesId(newMessageId);
    setChatUser(newChat);
    setChatVisible(true);
  };
  
  
  

  const handleSearchClick = () => {
    if (searchResult?.existingChat) {
      setChat(searchResult.existingChat);
    } else {
      addChat();
    }
    setShowSearch(false);
  };

  const getAvatarUrl = (item) => {
    if (item?.userData?.isBot) return assets.bot_avatar;
    const avatar = item?.userData?.avatar;
    return avatar
      ? avatar.startsWith("/uploads")
        ? `${SERVER_BASE_URL}${avatar}`
        : avatar
      : assets.avatar_icon;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString();
    }
  };

  

  useEffect(() => {
    if (!searchQuery) {
      setShowSearch(false);
      setSearchResult(null);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        setShowSearch(true);
        const res = await axios.get(`/user/search?username=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const foundUser = res.data;

        if (foundUser && foundUser._id !== userData._id) {
          const existingChat = chatData.find(
            (chat) =>
              chat.rId === foundUser._id || chat.userData?._id === foundUser._id
          );

          setSearchResult(
            existingChat ? { ...foundUser, existingChat } : foundUser
          );
        } else {
          setSearchResult(null);
        }
      } catch (err) {
        console.warn("Search failed silently");
        setSearchResult(null);
      }
    }, 400);
  }, [searchQuery]);

  return (
    <div className={`ls ${chatVisible ? "hidden md:block" : "block"}`}>
      <div className="ls-top">
        <div className="ls-nav " style={{ marginBottom: "20px" }}>
          {/* Sliding Menu Components */}
          <MenuToggle isOpen={isMenuOpen} toggle={toggleMenu} />
          <SlidingMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            navigate={navigate}
          />{" "}
          <p
            style={{ marginLeft: "50px", fontSize: "1.3rem", marginTop: "5px" }}
          >
            Menu
          </p>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt="Search" />
          <input
            type="text"
            placeholder="Search username..."
            onChange={inputHandler}
          />
        </div>
      </div>

      <div className="ls-list">
        {/* Main Bot Entry */}
        <div className="friends chat-item header-item">
          <div className="chat-left no-pointer">
            <img src={botUser.avatar} alt="Bot" className="avatar-circle" />
            <div className="chat-info">
              <p>{botUser.name}</p>
              <span>AI Assistant</span>
            </div>
          </div>
          <button className="new-chat-btn" onClick={createNewBotChat}>
            + New Chat
          </button>
        </div>

        {/* Virtual Bot Chat Entries */}
        {virtualBotChats.map((chat, index) => (
          <div
            key={chat.messageId}
            className={`friends chat-item ${
              chat.messageId === messagesId ? "active" : ""
            }`}
          >
            <div className="chat-left" onClick={() => setChat(chat)}>
              <img
                src={assets.bot_avatar}
                alt="Bot"
                style={{ objectFit: "cover" }}
                className="avatar-circle"
              />
              <div className="chat-info">
                <div className="chat-header">
                  <p>{chat.title}</p>
                  <span className="chat-time">
                    {formatTime(chat.createdAt || chat.updatedAt)}
                  </span>
                </div>
                <span>{chat.lastMessage?.slice(0, 30) || "New chat"}</span>
              </div>
            </div>
            <i
              className="ri-delete-bin-5-fill delete-icon"
              title="Delete bot chat"
              onClick={async () => {
                try {
                  // Delete from backend
                  await axios.delete(`/chat/${userData._id}/${chat.messageId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  
              
                  // Delete from local storage
                  const updated = virtualBotChats.filter(
                    (c) => c.messageId !== chat.messageId
                  );
                  setVirtualBotChats(updated);
                  localStorage.setItem(
                    `virtual_bot_chats_${userData._id}`,
                    JSON.stringify(updated)
                  );
                  localStorage.removeItem(`${chat.messageId}_messages`);
              
                  // Reset UI if this was the open chat
                  if (messagesId === chat.messageId) {
                    setMessages([]);
                    setMessagesId(null);
                    setChatUser(null);
                    setChatVisible(false);
                  }
              
                  toast.success("Bot chat deleted");
                } catch (err) {
                  console.error("Failed to delete bot chat:", err.message);
                  toast.error("Failed to delete bot chat");
                }
              }}
              
            ></i>
          </div>
        ))}

        {/* User Chats */}
        {showSearch && searchResult ? (
          <div onClick={handleSearchClick} className="friends chat-item">
            <div className="chat-left">
              <img src={getAvatarUrl({ userData: searchResult })} alt="User" />
              <div className="chat-info">
                <p>{searchResult.name}</p>
                <span>
                  {searchResult?.existingChat
                    ? "Open existing chat"
                    : "Start a new chat"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
          {chatData
            .filter(chat => chat.rId !== "bot")
            .map((item, index) => (
              <div
                key={item.messageId}
                className={`friends chat-item ${
                  deletingId === item.rId ? "fade-out" : ""
                } ${
                  item.messageSeen || item.messageId === messagesId
                    ? ""
                    : "border"
                }`}
              >
                <div className="chat-left" onClick={() => setChat(item)}>
                  <img
                    src={getAvatarUrl(item)}
                    alt="Avatar"
                    className="avatar-circle"
                  />
                  <div className="chat-info">
                    <div className="chat-header">
                      <p className="chat-name">{item.userData?.name || "User"}</p>
                      <span className="chat-time">{formatTime(item.updatedAt)}</span>
                    </div>
                    <span className="chat-message">
                      {item.lastMessage?.slice(0, 30) || "No messages yet"}
                    </span>
                  </div>
                </div>
                <i
                  className="ri-delete-bin-5-fill delete-icon"
                  title="Delete chat"
                  onClick={() => deleteChat(item.rId)}
                ></i>
              </div>
          ))}
          </>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;
