import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "../../config/api";

const SupportiveMemoryMessage = () => {
  const { userData, chatData } = useContext(AppContext);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        if (!userData?._id) return;
  
        const res = await axios.get(`/insights/reflective-message/${userData._id}`);
        setMessage(res.data.message);
      } catch (err) {
        console.error("Error fetching reflective message:", err);
        setMessage("You're doing your best — and that's more than enough 💛");
      }
    };
  
    fetchMemory();
  }, [userData?._id]);  // Only run when user is ready
  

  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      marginBottom: "16px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      padding: "20px"
    }}>
      <div style={{ fontSize: "1.125rem", fontWeight: 500, marginBottom: "12px" }}>
        From Your Past Reflections 💬
      </div>
      <div style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.5 }}>
        {message || "Pulling supportive memory..."}
      </div>
    </div>
  );
};

export default SupportiveMemoryMessage;
