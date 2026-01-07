import React, { useContext, useEffect, useState } from "react";
import "./Chat.css";
import LeftSidebar from "../../components/LeftSidebar/LeftSidebar";
import ChatBox from "../../components/ChatBox/ChatBox";
import RightSidebar from "../../components/RightSidebar/RightSidebar";
import { AppContext } from "../../context/AppContext";

const Chat = () => {
  const { chatVisible } = useContext(AppContext); // ✅ Make sure this exists in AppContext

  const { chatData, userData } = useContext(AppContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chatData && userData) {
      setLoading(false);
    }
  }, [chatData, userData]);

  return (
    <div className="chat">
      {loading ? (
        <p className="loading">Loading...</p>
      ) : (
        <div className="chat-container">
          <div className={`ls ${chatVisible ? 'hidden' : ''} md:block`}>
            <LeftSidebar />
          </div>
          <div className="chat-box">
            <ChatBox />
          </div>
          <div className="rs">
            <RightSidebar />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
