import React, { useEffect, useState, useContext, useRef } from "react";
import { toast } from "react-toastify";
import axios from "../../config/api";
import { AppContext } from "../../context/AppContext";

import WeeklyMoodChart from "../../components/Charts/WeeklyMoodChart";
import EmotionFrequencyChart from "../../components/Charts/EmotionFrequencyChart";
import TimeOfDayPieChart from "../../components/Charts/TimeOfDayPieChart";
import ChatActivityHeatmap from "../../components/Charts/ChatActivityHeatmap";
import MoodTimelineContainer from "../../components/Charts/MoodTimelineContainer";
import EmotionStabilityRadar from "../../components/Charts/EmotionStabilityRadar";
// import SessionNarrativeTimeline from "../MainInsights/SessionNarrativeTimeline";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

dayjs.extend(utc);
dayjs.extend(timezone);

const getRangeStartDate = (range) => {
  const now = dayjs().tz("Asia/Kolkata");
  switch (range) {
    case "day":
      return now.startOf("day");
    case "week":
      return now.startOf("week");
    case "month":
      return now.startOf("month");
    case "year":
      return now.startOf("year");
    default:
      return now.startOf("week");
  }
};

const MoodCharts = () => {
  const pdfRef = useRef();
  const [timeRange, setTimeRange] = useState("day");
  const { userData, chatData } = useContext(AppContext);
  const [weeklyMoodData, setWeeklyMoodData] = useState([]);
  const [activeTab, setActiveTab] = useState("weekly");

  const [emotionFrequencyData, setEmotionFrequencyData] = useState([]);
  const [timeOfDayData, setTimeOfDayData] = useState([]);
  const [aiSummary, setAiSummary] = useState(""); // ✅ Add this
  const getEmptyWeekTemplate = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((day) => ({ day, mood: 0 }));
  };

  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        if (!userData || !chatData?.length) return;

        const moodScoreMap = {
          happy: 9,
          excited: 8,
          grateful: 8,
          calm: 7,
          neutral: 5,
          bored: 4,
          tired: 3,
          frustrated: 2,
          anxious: 2,
          sad: 1,
        };

        const botChats = chatData.filter((chat) => chat.rId === "bot");
        const messageIds = botChats.map((chat) => chat.messageId);
        const rangeStart = getRangeStartDate(timeRange);

        const moodResults = await Promise.all(
          messageIds.map(async (id) => {
            const res = await axios.get(`/insights/mood-trends/${id}`);
            return res.data?.moodEntries || [];
          })
        );

        // 🔁 Group all mood entries by exact date
        const dailyScores = {};

        moodResults.flat().forEach((entry) => {
          const dateStr = dayjs(entry._id)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD");
          if (dayjs(dateStr).isBefore(rangeStart)) return;

          if (!dailyScores[dateStr]) dailyScores[dateStr] = [];

          entry.moods.forEach((m) => {
            const score = moodScoreMap[m.mood] || 5;
            for (let i = 0; i < m.count; i++) {
              dailyScores[dateStr].push(score); // account for repeated moods
            }
          });
        });

        const dayMap = getEmptyWeekTemplate();

        Object.entries(dailyScores).forEach(([dateStr, scores]) => {
          const dateObj = new Date(dateStr);
          const dayLabel = dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            timeZone: "Asia/Kolkata",
          });

          const avg =
            scores.length > 0
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : 0;

          const dayIndex = dayMap.findIndex((d) => d.day === dayLabel);
          if (dayIndex !== -1) {
            dayMap[dayIndex].mood = avg;
          }
        });

        setWeeklyMoodData(dayMap);
      } catch (err) {
        console.error("❌ Error fetching mood trends:", err);
      }
    };

    fetchMoodData();
  }, [userData, chatData, timeRange]);

  useEffect(() => {
    const fetchEmotionFrequencies = async () => {
      try {
        if (!userData || !chatData?.length) return;

        const botChats = chatData.filter((c) => c.rId === "bot");
        const messageIds = botChats.map((c) => c.messageId);

        const validEmotions = [
          "happy",
          "excited",
          "grateful",
          "calm",
          "neutral",
          "bored",
          "tired",
          "frustrated",
          "anxious",
          "sad",
        ];

        const emotionCount = {};

        const results = await Promise.all(
          messageIds.map(async (id) => {
            const res = await axios.get(`/insights/mood-trends/${id}`);
            return res.data?.moodEntries || [];
          })
        );

        const now = dayjs().tz("Asia/Kolkata");

        const isInRange = (dateStr) => {
          const date = dayjs(dateStr).tz("Asia/Kolkata");
          if (timeRange === "day") return date.isSame(now, "day");
          if (timeRange === "week") return date.isSame(now, "week");
          if (timeRange === "month") return date.isSame(now, "month");
          return true;
        };

        results.flat().forEach((entry) => {
          if (!isInRange(entry._id)) return;

          entry.moods.forEach((m) => {
            const mood = m.mood.toLowerCase();
            if (validEmotions.includes(mood)) {
              emotionCount[mood] = (emotionCount[mood] || 0) + m.count;
            } else {
              emotionCount["Others"] = (emotionCount["Others"] || 0) + m.count;
            }
          });
        });

        const formattedData = Object.entries(emotionCount)
          .map(([emotion, count]) => ({ emotion, count }))
          .sort((a, b) => b.count - a.count);

        setEmotionFrequencyData(formattedData);
      } catch (err) {
        console.error("❌ Error fetching emotion frequency:", err);
      }
    };

    fetchEmotionFrequencies();
  }, [userData, chatData, timeRange]);

  useEffect(() => {
    const fetchTimeOfDayStats = async () => {
      try {
        if (!userData || !chatData?.length) return;

        const botChats = chatData.filter((chat) => chat.rId === "bot");
        const messageIds = botChats.map((chat) => chat.messageId);

        const timeBuckets = {
          Morning: 0,
          Afternoon: 0,
          Evening: 0,
          Night: 0,
        };

        const now = dayjs().tz("Asia/Kolkata");

        const isInRange = (dateStr) => {
          const entryDate = dayjs(dateStr).tz("Asia/Kolkata");
          if (timeRange === "day") return entryDate.isSame(now, "day");
          if (timeRange === "week") return entryDate.isSame(now, "week");
          if (timeRange === "month") return entryDate.isSame(now, "month");
          return true;
        };

        const allEntries = [];

        for (const id of messageIds) {
          const res = await axios.get(`/insights/moods/${id}`);
          allEntries.push(...res.data);
        }

        allEntries.forEach((entry) => {
          const entryTime = dayjs(entry.createdAt).tz("Asia/Kolkata");

          if (!isInRange(entryTime)) return;

          const hour = entryTime.hour(); // 0-23

          let period = "";
          if (hour >= 5 && hour < 12) period = "Morning";
          else if (hour >= 12 && hour < 17) period = "Afternoon";
          else if (hour >= 17 && hour < 21) period = "Evening";
          else period = "Night";

          timeBuckets[period] += 1;
        });

        const formatted = Object.entries(timeBuckets).map(([name, value]) => ({
          name,
          value,
        }));

        setTimeOfDayData(formatted);
      } catch (err) {
        console.error("❌ Error fetching time-of-day data:", err);
      }
    };

    fetchTimeOfDayStats();
  }, [userData, chatData, timeRange]);
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`/insights/summary/${userData._id}`);
        setAiSummary(res.data.summary);
      } catch (err) {
        console.error("❌ Failed to fetch AI summary:", err);
        setAiSummary("Unable to load summary at the moment.");
      }
    };

    if (userData) fetchSummary();
  }, [userData]);

  const stripUnsupportedColors = (rootElement) => {
    const elements = rootElement.querySelectorAll("*");

    elements.forEach((el) => {
      const computedStyle = window.getComputedStyle(el);

      [
        "color",
        "backgroundColor",
        "borderColor",
        "borderTopColor",
        "borderRightColor",
        "borderBottomColor",
        "borderLeftColor",
      ].forEach((prop) => {
        const value = computedStyle.getPropertyValue(prop);

        if (value.includes("oklch")) {
          el.style[prop] = "#000"; // fallback to black for text/borders
          if (prop.includes("background")) {
            el.style[prop] = "#fff"; // fallback to white for background
          }
        }
      });
    });
  };
  const downloadPDF = async () => {
    try {
      toast.info("Generating PDF, please wait...");

      if (!pdfRef.current) return;

      // Scope for PDF styling
      pdfRef.current.setAttribute("data-pdf-export", "true");

      // Strip problematic computed styles
      stripUnsupportedColors(pdfRef.current);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Mood_Insights_${timeRange}.pdf`);

      toast.success("PDF downloaded successfully!");
    } catch (err) {
      console.error("📥 PDF Error:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      width: "100%",
      backgroundColor: "#ffffff",
    },
    header: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    headerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "16px",
    },
    title: {
      fontSize: "2rem",
      fontWeight: "bold",
      margin: 0,
    },
    subtitle: {
      color: "#64748b",
      margin: 0,
    },
    controls: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    select: {
      width: "140px",
      padding: "8px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      backgroundColor: "white",
      fontSize: "0.875rem",
    },
    button: {
      padding: "8px",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      backgroundColor: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    tabs: {
      width: "100%",
      marginBottom: "10px",
    },
    tabsList: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      backgroundColor: "#f1f5f9",
      borderRadius: "8px",
      padding: "4px",
      marginBottom: "16px",
    },
    tabsTrigger: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      border: "none",
      backgroundColor: "transparent",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "500",
      transition: "all 0.2s ease",
    },
    tabsTriggerActive: {
      backgroundColor: "white",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      border: "1px solid #e2e8f0",
    },
    cardHeader: {
      padding: "20px 24px 16px",
      borderBottom: "1px solid #f1f5f9",
    },
    cardTitle: {
      fontSize: "1.25rem",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      margin: 0,
    },
    cardContent: {
      padding: "24px",
      height: "350px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      textAlign: "center",
    },
    chartPlaceholder: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #dbeafe 0%, #f3e8ff 100%)",
      borderRadius: "8px",
      flexDirection: "column",
      gap: "16px",
    },
    chartIcon: {
      fontSize: "4rem",
      color: "#64748b",
    },
    chartText: {
      fontSize: "1.125rem",
      fontWeight: "500",
      color: "#64748b",
    },
    chartSubtext: {
      fontSize: "0.875rem",
      color: "#64748b",
      marginTop: "8px",
    },
    lineChart: {
      width: "100%",
      height: "300px",
      position: "relative",
      background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
      borderRadius: "8px",
      padding: "20px",
    },
    barChart: {
      display: "flex",
      alignItems: "end",
      justifyContent: "space-around",
      height: "250px",
      padding: "20px",
      background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
      borderRadius: "8px",
      gap: "8px",
    },
    bar: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      flex: 1,
    },
    barRect: {
      width: "100%",
      maxWidth: "40px",
      borderRadius: "4px 4px 0 0",
      transition: "all 0.3s ease",
    },
    barLabel: {
      fontSize: "0.75rem",
      fontWeight: "500",
      color: "#374151",
    },
    pieChart: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "300px",
      background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
      borderRadius: "8px",
      position: "relative",
    },
    pieContainer: {
      position: "relative",
      width: "200px",
      height: "200px",
    },
    aiSummaryCard: {
      background: "linear-gradient(to right, #dbeafe, #f3e8ff)",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
    },
    aiSummaryContent: {
      padding: "24px",
    },
    aiSummaryText: {
      color: "#64748b",
      lineHeight: 1.6,
      margin: 0,
      marginBottom: "16px",
    },
    aiSummaryButtons: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    aiButton: {
      padding: "8px 16px",
      fontSize: "0.875rem",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      backgroundColor: "white",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
  };

  return (
    <div style={styles.container}>
      <div ref={pdfRef}>
        <style>
          {`
          .tab-trigger:hover {
            background-color: #f8fafc !important;
          }
          .tab-trigger-active:hover {
            background-color: white !important;
          }
          .ai-button:hover {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
          }
          .control-button:hover {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
          }
        `}
        </style>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div>
              <h2 style={styles.title}>Your Mood Insights</h2>
              <p style={styles.subtitle}>
                Discover patterns in your emotional journey
              </p>
            </div>
            <div style={styles.controls}>
              <select
                style={styles.select}
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              <button
                style={styles.button}
                className="control-button"
                onClick={downloadPDF}
              >
                📥
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <div style={styles.tabsList}>
            {["weekly", "emotions", "activity", "timeofday"].map((tab) => (
              <button
                key={tab}
                style={{
                  ...styles.tabsTrigger,
                  ...(activeTab === tab ? styles.tabsTriggerActive : {}),
                }}
                className={
                  activeTab === tab ? "tab-trigger-active" : "tab-trigger"
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab === "weekly" && "📈 Weekly Mood"}
                {tab === "emotions" && "📊 Emotions"}
                {tab === "activity" && "📅 Activity"}
                {tab === "timeofday" && "🕐 Time of Day"}
                {tab === "timeline" && "📉 Mood Timeline"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "weekly" && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>📈 Weekly Mood Trends</h3>
              </div>
              <div style={{ width: "100%", height: "120%", padding: "8px" }}>
                <WeeklyMoodChart weeklyMoodData={weeklyMoodData} />
              </div>
            </div>
          )}

          {activeTab === "emotions" && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>📊 Emotion Frequency</h3>
              </div>
              <div style={{ padding: "24px" }}>
                <EmotionFrequencyChart data={emotionFrequencyData} />
              </div>
            </div>
          )}
          {activeTab === "activity" && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>📅 Chat Activity Heatmap</h3>
              </div>
              <div style={{ padding: "24px", paddingLeft: "0px" }}>
                <ChatActivityHeatmap />
              </div>
            </div>
          )}
          {activeTab === "timeofday" && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>🕐 Emotion vs. Time of Day</h3>
              </div>
              <div style={{ padding: "24px" }}>
                <TimeOfDayPieChart data={timeOfDayData} />
              </div>
            </div>
          )}
        </div>

        {/* Mood Prediction Timeline */}
        <MoodTimelineContainer />
        <EmotionStabilityRadar />
        {/* <SessionNarrativeTimeline /> */}

        {/* AI Summary */}
        <div style={styles.aiSummaryCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>📊 AI Summary Insights</h3>
          </div>
          <div style={styles.aiSummaryContent}>
            <p style={styles.aiSummaryText}>
              {aiSummary || "Loading personalized insights..."}
            </p>
            {/* <div style={styles.aiSummaryButtons}>
              <button style={styles.aiButton}>Get Resources</button>
              <button style={styles.aiButton}>Schedule Check-in</button>
            </div> */}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MoodCharts;
