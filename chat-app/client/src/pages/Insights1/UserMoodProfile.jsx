import { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "../../config/api";
import MoodInsightsCard from "../MainInsights/MoodInsightsCard";
import avatarImages from "../../assets/avatars/_avatarMap";

const UserMoodProfile = () => {
  const { userData } = useContext(AppContext);

  const [weeklyMoodAverage, setWeeklyMoodAverage] = useState("😊");
  const [recentEmotions, setRecentEmotions] = useState([]);
  const [gender, setGender] = useState("Male"); // Toggle: Male/Female
  const [suggestedActivities, setSuggestedActivities] = useState([]);
  const [quote] = useState("Every day is a new opportunity to grow and shine!");
  const [currentMood, setCurrentMood] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [topMood, setTopMood] = useState("Happy");
  const [avatarSrc, setAvatarSrc] = useState(""); // dynamic avatar

  // 🆕 Journal state (connected to backend)
  const [journalEntries, setJournalEntries] = useState([]);
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);
  const [showJournalPage, setShowJournalPage] = useState(false);

  const emojiMap = {
    happy: "😊",
    sad: "😔",
    tired: "😴",
    frustrated: "😤",
    excited: "🤩",
    calm: "😌",
    anxious: "😰",
    grateful: "🙏",
    neutral: "😐",
    bored: "🥱",
  };

  const [messageIds, setMessageIds] = useState([]);

  // ✅ Fetch journal entries from backend
  const fetchJournalEntries = async (ids) => {
    try {
      const allJournals = await Promise.all(
        ids.map((id) =>
          axios.get(`/journal/${id}`, {
            headers: { Authorization: `Bearer ${userData?.token}` },
          })
        )
      );
      const combined = allJournals.flatMap((res) => res.data);
      setJournalEntries(
        combined.sort((a, b) => new Date(b.date) - new Date(a.date))
      );
    } catch (err) {
      console.error("❌ Failed to fetch journals", err);
    }
  };

  // ✅ Submit journal to backend
  const handleJournalSubmit = async () => {
    if (!journalTitle.trim() || !journalContent.trim() || !messageIds.length)
      return;

    setIsSubmittingJournal(true);

    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    try {
      const res = await axios.post(
        "/journal/add",
        {
          messageId: messageIds[0], // ✅ Use only one messageId
          title: journalTitle,
          content: journalContent,
        },
        {
          headers: { Authorization: `Bearer ${userData?.token}` },
        }
      );

      setJournalEntries((prev) => [res.data, ...prev]);
      setJournalTitle("");
      setJournalContent("");
    } catch (err) {
      console.error("❌ Journal submission failed", err);
    } finally {
      setIsSubmittingJournal(false);
    }
  };
  const handleDeleteJournal = async (id) => {
    try {
      await axios.delete(`/journal/${id}`, {
        headers: { Authorization: `Bearer ${userData?.token}` },
      });
      setJournalEntries((prev) => prev.filter((entry) => entry._id !== id));
    } catch (err) {
      console.error("❌ Failed to delete journal entry:", err);
    }
  };

  // ✅ Fetch all insights + journal
  const fetchInsightsFromAllBotChats = async () => {
    if (!userData?._id) return;

    try {
      const res = await axios.get(`/chat/${userData._id}`);
      const botChats = res.data.chats.filter((chat) => chat.rId === "bot");
      const ids = botChats.map((chat) => chat.messageId);
      setMessageIds(ids);

      if (!ids.length) return;

      // Journals (run in parallel)
      fetchJournalEntries(ids);

      const moodTrendPromises = ids.map((id) =>
        axios.get(`/insights/mood-trends/${id}`).then((r) => r.data)
      );
      const emotionPromises = ids.map((id) =>
        axios.get(`/insights/recent-emotions/${id}`).then((r) => r.data)
      );
      const suggestionPromises = ids.map((id) =>
        axios.get(`/insights/suggestions/${id}`).then((r) => r.data)
      );

      const moodResults = await Promise.all(moodTrendPromises);
      const emotionResults = await Promise.all(emotionPromises);
      const suggestionResults = await Promise.all(suggestionPromises);

      // Top mood calculation
      const allMoods = moodResults.flatMap((entry) =>
        entry.moodEntries.flatMap((e) => e.moods.map((m) => m.mood))
      );
      const freqMap = allMoods.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        return acc;
      }, {});
      const topMood =
        Object.entries(freqMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "happy";
      setWeeklyMoodAverage(emojiMap[topMood] || "😊");
      setTopMood(topMood);
      setAvatarSrc(getAvatar(gender, topMood));

      // Unique recent emotions
      const allEmotions = emotionResults.flat().map((e) => ({
        emoji: emojiMap[e.mood] || "😐",
        emotion: e.mood,
        timestamp: new Date(e.timestamp),
      }));

      const uniqueEmotions = [];
      const seenMoods = new Set();
      allEmotions
        .sort((a, b) => b.timestamp - a.timestamp)
        .forEach((e) => {
          if (!seenMoods.has(e.emotion) && uniqueEmotions.length < 5) {
            seenMoods.add(e.emotion);
            uniqueEmotions.push({
              ...e,
              timestamp: e.timestamp.toLocaleString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                weekday: "short",
                day: "numeric",
                month: "short",
              }),
            });
          }
        });
      setRecentEmotions(uniqueEmotions);

      // Unique suggested activities
      const allActivities = suggestionResults.flat();
      const activityMap = new Map();
      allActivities.forEach((act) => {
        if (!activityMap.has(act.activity)) {
          activityMap.set(act.activity, act);
        }
      });
      setSuggestedActivities(Array.from(activityMap.values()));
    } catch (err) {
      console.error("❌ Failed to fetch insights:", err.message);
    }
  };

  useEffect(() => {
    fetchInsightsFromAllBotChats();
  }, [userData]);

  useEffect(() => {
    setAvatarSrc(getAvatar(gender, topMood));
  }, [gender, topMood]);

  const handleMoodSubmit = async () => {
    if (!currentMood || !userData?._id) return;
    setIsSubmitting(true);

    try {
      const res = await axios.get(`/chat/${userData._id}`);
      const botChats = res.data.chats
        .filter((c) => c.rId === "bot")
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      const latestMessageId = botChats[0]?.messageId;

      if (!latestMessageId) return;

      // ✅ Log mood check-in to backend
      await axios.post(`/message/${latestMessageId}`, {
        senderId: userData._id,
        text: `Feeling ${currentMood}`,
        mood: currentMood.toLowerCase(),
        isCheckIn: true, // ✅ Add this flag
      });

      setCurrentMood("");
      fetchInsightsFromAllBotChats(); // Refresh UI
    } catch (err) {
      console.error("❌ Mood submission failed:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFallbackAvatar = (gender) =>
    gender === "Female"
      ? avatarImages["Female_Confused"]
      : avatarImages["Male_Confused"];

  const getAvatar = (gender, mood) => {
    const moodKey = mood?.charAt(0).toUpperCase() + mood.slice(1).toLowerCase();
    const key = `${gender}_${moodKey}`;
    return avatarImages[key] || getFallbackAvatar(gender);
  };

  const userName = userData?.name || "Alex Johnson";
  const userAvatar = avatarSrc;

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      height: "100%",
      backgroundColor: "#ffffff",
      width: "100%",
    },
    card: {
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e2e8f0",
    },
    cardHeader: {
      padding: "16px 20px 12px",
    },
    cardContent: {
      padding: "0 20px 20px",
    },
    userSummary: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "1px",
    },
    avatar: {
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      objectFit: "cover",
    },
    userInfo: {
      flex: 1,
    },
    greeting: {
      fontSize: "1.125rem",
      fontWeight: "600",
      margin: 0,
      marginBottom: "4px",
    },
    moodAverage: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    moodEmoji: {
      fontSize: "1.5rem",
    },
    badge: {
      backgroundColor: "#f1f5f9",
      color: "#475569",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "0.75rem",
      fontWeight: "500",
    },
    quoteBox: {
      background: "linear-gradient(to right, #dbeafe, #f3e8ff)",
      padding: "12px",
      borderRadius: "8px",
    },
    quote: {
      fontSize: "0.875rem",
      fontStyle: "italic",
      color: "#64748b",
      margin: 0,
    },
    sectionTitle: {
      fontSize: "1.125rem",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      margin: 0,
      marginBottom: "8px",
    },
    sectionSubtitle: {
      fontSize: "0.875rem",
      color: "#64748b",
      margin: 0,
      marginBottom: "16px",
    },
    moodGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "8px",
      marginBottom: "16px",
    },
    moodButton: {
      height: "48px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      backgroundColor: "#ffffff",
      cursor: "pointer",
      transition: "all 0.2s ease",
      fontSize: "0.75rem",
    },
    moodButtonActive: {
      backgroundColor: "#3b82f6",
      color: "white",
      borderColor: "#3b82f6",
    },
    moodEmoji2: {
      fontSize: "1.125rem",
      marginBottom: "2px",
    },
    submitButton: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#3b82f6",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "background-color 0.2s ease",
    },
    submitButtonDisabled: {
      backgroundColor: "#94a3b8",
      cursor: "not-allowed",
    },
    emotionsList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    emotionItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px",
      borderRadius: "8px",
      backgroundColor: "rgba(241, 245, 249, 0.3)",
    },
    emotionLeft: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    emotionEmoji: {
      fontSize: "1.25rem",
    },
    emotionName: {
      fontWeight: "500",
      fontSize: "0.875rem",
    },
    emotionTime: {
      fontSize: "0.75rem",
      color: "#64748b",
    },
    activitiesList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    activityItem: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "12px",
      borderRadius: "8px",
      background: "linear-gradient(to right, #f0fdf4, #dbeafe)",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    activityIcon: {
      fontSize: "1.5rem",
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: "0.875rem",
      fontWeight: "500",
      margin: 0,
      marginBottom: "4px",
    },
    activityReason: {
      fontSize: "0.75rem",
      color: "#64748b",
      margin: 0,
    },
    spinner: {
      width: "16px",
      height: "16px",
      border: "2px solid transparent",
      borderTop: "2px solid currentColor",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
    // Journal styles
    journalForm: {
      background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
      padding: "16px",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      marginBottom: "16px",
    },
    journalInput: {
      width: "100%",
      padding: "8px 12px",
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      fontSize: "0.875rem",
      marginBottom: "12px",
      backgroundColor: "#ffffff",
      outline: "none",
      transition: "border-color 0.2s ease",
    },
    journalTextarea: {
      width: "100%",
      maxWidth: "300px", // You can reduce more if needed      padding: "8px 12px",
      border: "1px solid #d1d5db",
      minWidth: "0px",
      borderRadius: "6px",
      fontSize: "0.875rem",
      marginBottom: "12px",
      backgroundColor: "#ffffff",
      outline: "none",
      resize: "vertical",
      minHeight: "100px",
      fontFamily: "inherit",
      transition: "border-color 0.2s ease",
    },
    journalMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    journalDateTime: {
      fontSize: "0.75rem",
      color: "#64748b",
    },
    journalSubmitButton: {
      padding: "8px 16px",
      backgroundColor: "#8b5cf6",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      transition: "background-color 0.2s ease",
    },
    journalSubmitButtonDisabled: {
      backgroundColor: "#94a3b8",
      cursor: "not-allowed",
    },
    journalEntriesList: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      maxHeight: "300px",
      overflowY: "auto",
    },
    journalEntry: {
      background: "linear-gradient(to right, #eff6ff, #f0f9ff)",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #bfdbfe",
    },
    journalEntryHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "8px",
    },
    journalEntryTitle: {
      fontSize: "0.875rem",
      fontWeight: "600",
      color: "#1f2937",
      margin: 0,
    },
    journalEntryDateTime: {
      fontSize: "0.75rem",
      color: "#6b7280",
      display: "flex",
      alignItems: "center",
      gap: "4px",
    },
    journalEntryContent: {
      fontSize: "0.875rem",
      color: "#374151",
      lineHeight: "1.5",
      margin: 0,
    },
    // Journal page styles
    journalPageContainer: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "#ffffff",
      zIndex: 1000,
      overflow: "auto",
      // display: "flex",
    },

    backButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "10px 16px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "0.875rem",
      fontWeight: "500",
      transition: "background-color 0.2s ease",
    },
    journalPageContent: {
      padding: "30px 20px",
      maxWidth: "800px",
      margin: "0 auto",
    },
    journalPageEntry: {
      background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "24px",
      color: "white",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
      position: "relative",
      overflow: "hidden",
    },
    journalPageEntryBg: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
    },

    viewAllButton: {
      backgroundColor: "#8b5cf6",
      color: "white",
      border: "none",
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "0.75rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s ease",
    },
    journalEntriesHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
    },
    journalEntryOneLine: {
      fontSize: "0.875rem",
      color: "#374151",
      lineHeight: "1.5",
      margin: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    journalPageHeader: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      color: "white",
      padding: "20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      flexWrap: "nowrap",
      width: "100%",
      gap: "16px",
    },

    journalPageTitle: {
      fontSize: "1.5rem",
      fontWeight: "700",
      margin: 0,
      textAlign: "center",
      whiteSpace: "nowrap",
      flex: "2",
      width: "100%",
    },

    journalPageEntryContent: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      maxWidth: "100px",
      justifyContent: "space-between",
    },

    journalPageEntryHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginBottom: "12px",
      flexWrap: "wrap",
      gap: "12px",
    },

    journalPageEntryTitle: {
      fontSize: "1.3rem",
      fontWeight: "700",
      margin: 0,
      color: "white",
      flex: "1",
    },

    journalPageEntryDateTime: {
      fontSize: "0.65rem",
      color: "rgba(255, 255, 255, 0.85)",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      whiteSpace: "nowrap",
    },

    journalPageEntryText: {
      fontSize: "1rem",
      lineHeight: "1.6",
      color: "rgba(255, 255, 255, 0.95)",
      margin: 0,
      textAlign: "center",
      maxWidth: "100%",
    },
  };

  const moodOptions = [
    { emoji: "😊", label: "Happy" },
    { emoji: "😔", label: "Sad" },
    { emoji: "😴", label: "Tired" },
    { emoji: "😤", label: "Frustrated" },
    { emoji: "🤩", label: "Excited" },
    { emoji: "😌", label: "Calm" },
    { emoji: "😰", label: "Anxious" },
    { emoji: "🙏", label: "Grateful" },
  ];

  // Journal Page Component
  const JournalPage = () => {
    return (
      <div style={styles.journalPageContainer}>
        {/* Header */}
        <div style={styles.journalPageHeader}>
          <div style={{ flex: "1" }}>
            <button
              style={styles.backButton}
              onClick={() => setShowJournalPage(false)}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.3)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
              }
            >
              <span>←</span> Back
            </button>
          </div>

          <h1 style={styles.journalPageTitle}>📖 My Journal</h1>

          {/* Filler div for symmetry */}
          <div style={{ flex: "1" }} />
        </div>

        {/* Journal Entries Section */}
        <div style={styles.journalPageContent}>
          {journalEntries.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#64748b",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>📝</div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "8px",
                  color: "#374151",
                }}
              >
                No Journal Entries Yet
              </h2>
              <p>
                Start writing your thoughts and reflections to see them here.
              </p>
            </div>
          ) : (
            journalEntries.map((entry, index) => {
              const gradients = [
                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
                "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
                "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
                "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
              ];

              return (
                <div
                  key={entry.id}
                  style={{
                    ...styles.journalPageEntry,
                    background: gradients[index % gradients.length],
                  }}
                >
                  <div style={styles.journalPageEntryBg}></div>
                  <div style={styles.journalPageEntryContent}>
                    <div style={styles.journalPageEntryHeader}>
                      <h3 style={styles.journalPageEntryTitle}>
                        {entry.title}
                      </h3>
                      <div style={styles.journalPageEntryDateTime}>
                        <span>🕐</span> {entry.date} • {entry.time}
                      </div>
                    </div>
                    <p style={styles.journalPageEntryText}>{entry.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (showJournalPage) {
    return <JournalPage />;
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .activity-item:hover {
            background: linear-gradient(to right, #dcfce7, #bfdbfe) !important;
          }
          .mood-button:hover {
            background-color: #f1f5f9 !important;
          }
          .mood-button-active:hover {
            background-color: #2563eb !important;
          }
          .submit-button:hover:not(:disabled) {
            background-color: #2563eb !important;
          }
          .journal-input:focus {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
          }
          .journal-textarea:focus {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
          }
          .journal-submit-button:hover:not(:disabled) {
            background-color: #7c3aed !important;
          }
          .view-all-button:hover {
            background-color: #7c3aed !important;
          }
        `}
      </style>
      {/* User Summary Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.userSummary}>
            <div
              style={{
                padding: "16px",
                display: "flex",
                alignItems: "center",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ marginBottom: "0px" }}>
                <button
                  onClick={() =>
                    setGender((prev) => (prev === "Male" ? "Female" : "Male"))
                  }
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {gender === "Male" ? "M" : "F"}
                </button>
              </div>

              <img
                src={userAvatar}
                alt="User Avatar"
                style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
                <span style={styles.badge}>Weekly Average</span>
            </div>
            <div style={styles.userInfo}>
              <h3 style={styles.greeting}>
                {getTimeOfDay()}, {userName}!
              </h3>
              <div style={styles.moodAverage}>
                {/* <span style={styles.moodEmoji}>{weeklyMoodAverage}</span> */}
              </div>
            </div>
          </div>
        </div>
        <div style={styles.cardContent}>
          <div style={styles.quoteBox}>
            <p style={styles.quote}>"{quote}"</p>
          </div>
        </div>
      </div>
      {/* Quick Check-In */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.sectionTitle}>📈 Quick Check-In</h3>
          <p style={styles.sectionSubtitle}>How are you feeling right now?</p>
        </div>
        <div style={styles.cardContent}>
          <div style={styles.moodGrid}>
            {moodOptions.map((mood, index) => (
              <button
                key={index}
                style={{
                  ...styles.moodButton,
                  ...(currentMood === mood.label
                    ? styles.moodButtonActive
                    : {}),
                }}
                className={
                  currentMood === mood.label
                    ? "mood-button-active"
                    : "mood-button"
                }
                onClick={() => setCurrentMood(mood.label)}
              >
                <span style={styles.moodEmoji2}>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
          {currentMood && (
            <button
              onClick={handleMoodSubmit}
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                ...(isSubmitting ? styles.submitButtonDisabled : {}),
              }}
              className="submit-button"
            >
              {isSubmitting ? <div style={styles.spinner}></div> : null}
              Log {currentMood} Mood
            </button>
          )}
        </div>
      </div>
      {/* Recent Emotions Timeline */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.sectionTitle}>🕐 Recent Emotions</h3>
        </div>
        <div style={styles.cardContent}>
          <div style={styles.emotionsList}>
            {recentEmotions.map((emotion, index) => (
              <div key={index} style={styles.emotionItem}>
                <div style={styles.emotionLeft}>
                  <span style={styles.emotionEmoji}>{emotion.emoji}</span>
                  <span style={styles.emotionName}>{emotion.emotion}</span>
                </div>
                <span style={styles.emotionTime}>{emotion.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Suggested Activities */}
      <div style={{ ...styles.card }}>
        <div style={styles.cardHeader}>
          <h3 style={styles.sectionTitle}>Suggested Activities</h3>
          <p style={styles.sectionSubtitle}>
            Based on your recent mood patterns
          </p>
        </div>
        <div style={styles.cardContent}>
          <div style={styles.activitiesList}>
            {suggestedActivities.map((activity, index) => (
              <div
                key={index}
                style={styles.activityItem}
                className="activity-item"
              >
                <div style={styles.activityIcon}>{activity.icon}</div>
                <div style={styles.activityContent}>
                  <h4 style={styles.activityTitle}>{activity.activity}</h4>
                  <p style={styles.activityReason}>{activity.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Journal Writing Section */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.sectionTitle}>📝 Journal Writing</h3>
          <p style={styles.sectionSubtitle}>
            Write your thoughts and reflections
          </p>
        </div>
        <div style={styles.cardContent}>
          <div style={styles.journalForm}>
            <input
              type="text"
              placeholder="Enter your journal title..."
              value={journalTitle}
              onChange={(e) => setJournalTitle(e.target.value)}
              style={styles.journalInput}
              className="journal-input"
            />
            <textarea
              placeholder="Write your thoughts, feelings, or reflections here..."
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              style={styles.journalTextarea}
              className="journal-textarea"
              rows={4}
            />
            <div style={styles.journalMeta}>
              <div style={styles.journalDateTime}>
                {new Date().toLocaleDateString()} •{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <button
                onClick={handleJournalSubmit}
                disabled={
                  !journalTitle.trim() ||
                  !journalContent.trim() ||
                  isSubmittingJournal
                }
                style={{
                  ...styles.journalSubmitButton,
                  ...(!journalTitle.trim() ||
                  !journalContent.trim() ||
                  isSubmittingJournal
                    ? styles.journalSubmitButtonDisabled
                    : {}),
                }}
                className="journal-submit-button"
              >
                {isSubmittingJournal ? (
                  <div style={styles.spinner}></div>
                ) : (
                  <>
                    <span>📤</span>
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Journal Entries Log */}
      {journalEntries.length > 0 && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.journalEntriesHeader}>
              <div>
                <h3 style={styles.sectionTitle}>📚 Journal Entries</h3>
                <p style={styles.sectionSubtitle}>
                  Your recent journal entries
                </p>
              </div>
              <button
                style={styles.viewAllButton}
                className="view-all-button"
                onClick={() => setShowJournalPage(true)}
              >
                View All
              </button>
            </div>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.journalEntriesList}>
              {journalEntries.slice(0, 3).map((entry) => (
                <div key={entry._id} style={styles.journalEntry}>
                  <div
                    style={{
                      ...styles.journalEntryHeader,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <h4 style={styles.journalEntryTitle}>{entry.title}</h4>
                    <div style={styles.journalEntryDateTime}>
                      <span>🕐</span> {entry.date} • {entry.time}
                    </div>
                    <button
                      onClick={() => handleDeleteJournal(entry._id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#888",
                        fontSize: "1rem",
                        cursor: "pointer",
                        marginLeft: "auto",
                      }}
                      title="Delete Entry"
                    >
                      <i className="ri-close-circle-fill"></i>
                    </button>
                  </div>
                  <p style={styles.journalEntryOneLine}>
                    {entry.content.split("\n")[0] || entry.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {userData && <MoodInsightsCard userId={userData._id} />}{" "}
    </div>
  );
};

export default UserMoodProfile;
