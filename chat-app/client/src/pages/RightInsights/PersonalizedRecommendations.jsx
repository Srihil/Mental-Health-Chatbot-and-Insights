import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "../../config/api";

const PersonalizedRecommendations = () => {
  const { userData } = useContext(AppContext);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const styles = {
    card: {
      backgroundColor: "#fff",
      borderRadius: "12px",
      border: "1px solid #e0e7ff",
      marginBottom: "16px",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
      overflow: "hidden",
    },
    header: {
      padding: "16px 20px",
      background: "#f8fafc",
      borderBottom: "1px solid #e2e8f0",
      fontSize: "1.1rem",
      fontWeight: 600,
      color: "#1e293b",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    headerIcon: {
      fontSize: "1.5rem",
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    content: {
      padding: "16px 20px",
    },
    loadingContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 0",
      flexDirection: "column",
      gap: "8px",
    },
    loadingSpinner: {
      width: "28px",
      height: "28px",
      border: "3px solid #e2e8f0",
      borderTop: "3px solid #3b82f6",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    loadingText: {
      fontSize: "0.875rem",
      color: "#64748b",
      fontWeight: 500,
    },
    list: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    item: {
      display: "flex",
      gap: "12px",
      padding: "14px",
      borderRadius: "10px",
      background: "#f9fafb",
      border: "1px solid #e5e7eb",
      transition: "all 0.2s ease",
      cursor: "pointer",
    },
    iconContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "40px",
      height: "40px",
      borderRadius: "10px",
      background: "#e0f2fe",
      fontSize: "1.25rem",
      flexShrink: 0,
    },
    text: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    },
    title: {
      fontSize: "0.95rem",
      fontWeight: 600,
      color: "#1e293b",
      margin: 0,
    },
    desc: {
      fontSize: "0.8rem",
      color: "#64748b",
      margin: 0,
      lineHeight: 1.4,
    },
    emptyState: {
      textAlign: "center",
      padding: "24px 10px",
      color: "#64748b",
      fontSize: "0.9rem",
      fontWeight: 500,
    },
    emptyIcon: {
      fontSize: "2rem",
      marginBottom: "10px",
      opacity: 0.5,
    },
  };

  useEffect(() => {
    if (!userData?._id) return;

    const fetchSuggestions = async () => {
      try {
        const userId = userData._id;
        const todayKey = `dailySuggestions_${userId}`;
        const today = new Date().toLocaleDateString("en-IN");

        const cached = localStorage.getItem(todayKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.date === today) {
            setRecommendations(parsed.suggestions || []);
            setLoading(false);
            return;
          }
        }

        const res = await axios.get(`/insights/personalized-suggestions/${userId}`);
        const raw = res.data?.suggestions || [];

        const normalized = raw.map((s) => ({
          icon: s.icon || "💡",
          title: s.title || s.activity || "Untitled",
          description: s.description || s.reason || "No details provided.",
        }));

        setRecommendations(normalized);
        setLoading(false);

        localStorage.setItem(
          todayKey,
          JSON.stringify({ date: today, suggestions: normalized }),
        );
      } catch (err) {
        console.error("❌ Error fetching personalized suggestions:", err.message);
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [userData]);

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .recommendation-item:hover {
            background: #fff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          }
        `}
      </style>

      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>✨</span>
          Personalized Recommendations
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <div style={styles.loadingText}>Loading suggestions...</div>
            </div>
          ) : recommendations.length > 0 ? (
            <div style={styles.list}>
              {recommendations.map((item, i) => (
                <div key={i} style={styles.item} className="recommendation-item">
                  <div style={styles.iconContainer}>{item.icon}</div>
                  <div style={styles.text}>
                    <h4 style={styles.title}>{item.title}</h4>
                    <p style={styles.desc}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🌟</div>
              <div>No suggestions yet.</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PersonalizedRecommendations;
