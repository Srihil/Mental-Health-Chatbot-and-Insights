import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "../../config/api";

const StreakTracker = () => {
  const { userData } = useContext(AppContext);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Do not render or fetch until userData._id exists

  useEffect(() => {
    let interval;
    const fetchStreak = async () => {
      if (!userData || !userData._id) return;
      try {
        const res = await axios.get(`/streak/${userData._id}`);
        setStreak(res.data);
        setLoading(false); // ✅ ADD THIS LINE
      } catch (err) {
        console.error("❌ Failed to load streak:", err.message);
        setLoading(false); // ✅ Also stop loading on error
      }
    };

    if (userData && userData._id) {
      fetchStreak(); // Initial fetch
      interval = setInterval(fetchStreak, 60 * 1000); // ✅ Poll every 60s
    }

    return () => clearInterval(interval); // Clean up interval
  }, [userData]);

  if (loading) {
    return (
      <div className="streak-tracker">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your streak...</p>
        </div>
        <style>{`
          .streak-tracker {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 20px;
            padding: 32px 24px;
            margin: 0px 0 20px 0;
            box-shadow: 
              0 10px 25px -5px rgba(0, 0, 0, 0.1),
              0 8px 10px -6px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(226, 232, 240, 0.8);
            color: #374151;
            min-height: 180px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }
          
          .streak-tracker::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
            border-radius: 20px 20px 0 0;
          }
          
          .loading-container {
            text-align: center;
            z-index: 1;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f1f5f9;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
          }
          
          .loading-text {
            font-size: 0.95rem;
            color: #64748b;
            font-weight: 500;
            margin: 0;
          }
          
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (!streak) return null;

  const streakItems = [
    {
      icon: "🔥",
      label: "Current Streak",
      value: streak.currentStreak,
      unit: "days",
      color: "#ff6b6b",
      bgColor: "#fff5f5",
    },
    {
      icon: "🏆",
      label: "Longest Streak",
      value: streak.longestStreak,
      unit: "days",
      color: "#ffd93d",
      bgColor: "#fffbeb",
    },
    {
      icon: "📖",
      label: "Journals Logged",
      value: streak.journalCount,
      unit: "times",
      color: "#6bcf7f",
      bgColor: "#f0fdf4",
    },
    {
      icon: "🧠",
      label: "Reflections",
      value: streak.reflectionCount,
      unit: "times",
      color: "#4d96ff",
      bgColor: "#eff6ff",
    },
    {
      icon: "😌",
      label: "Calm Streak",
      value: streak.calmStreak,
      unit: "days",
      color: "#9775fa",
      bgColor: "#faf5ff",
    },
  ];

  return (
    <div className="streak-tracker">
      <div className="header">
        <div className="title-container">
          <h3 className="title">🧩 Your Wellness Journey</h3>
          <div className="title-decoration"></div>
        </div>
        <div className="subtitle">
          Track your progress and celebrate milestones
        </div>
      </div>

      <div className="streak-grid">
        {streakItems.map((item, index) => (
          <div
            key={index}
            className="streak-item"
            style={{
              "--accent-color": item.color,
              "--bg-color": item.bgColor,
            }}
          >
            <div className="streak-icon-container">
              <div className="streak-icon">{item.icon}</div>
            </div>
            <div className="streak-content">
              <div className="streak-value">
                {item.value}
                {item.unit && <span className="unit">{item.unit}</span>}
              </div>
              <div className="streak-label">{item.label}</div>
            </div>
            <div className="streak-glow"></div>
          </div>
        ))}
      </div>

      {streak.currentStreak >= 5 && (
        <div className="achievement-banner">
          <div className="achievement-content">
            <div className="achievement-icon-container">
              <span className="achievement-icon">🏅</span>
            </div>
            <span className="achievement-text">
              Amazing! You've achieved a {streak.currentStreak}-day wellness
              streak!
            </span>
          </div>
          <div className="achievement-sparkles">
            <span className="sparkle">✨</span>
            <span className="sparkle">⭐</span>
            <span className="sparkle">✨</span>
          </div>
        </div>
      )}

      <style>{`
        .streak-tracker {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          padding: 32px 24px;
          margin: 0px 0 20px 0;
          box-shadow: 
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(226, 232, 240, 0.8);
          color: #374151;
          position: relative;
          overflow: hidden;
        }
        
        .streak-tracker::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
          border-radius: 20px 20px 0 0;
        }

        .header {
          text-align: center;
          margin-bottom: 28px;
        }
        
        .title-container {
          position: relative;
          display: inline-block;
          margin-bottom: 8px;
        }

        .title {
          font-size: 1.4rem;
          font-weight: 700;
          margin: 0;
          color: #1f2937;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .title-decoration {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
          opacity: 0.6;
        }

        .subtitle {
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
          letter-spacing: 0.025em;
        }

        .streak-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .streak-item {
          background: var(--bg-color);
          border-radius: 16px;
          padding: 20px 16px;
          text-align: center;
          border: 2px solid rgba(255, 255, 255, 0.8);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .streak-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-color);
          transform: scaleX(0);
          transition: transform 0.4s ease;
          border-radius: 16px 16px 0 0;
        }

        .streak-item:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border-color: var(--accent-color);
        }

        .streak-item:hover .streak-glow {
          transform: scaleX(1);
        }
        
        .streak-icon-container {
          margin-bottom: 12px;
          position: relative;
        }

        .streak-icon {
          font-size: 1.8rem;
          display: inline-block;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }
        
        .streak-item:hover .streak-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .streak-value {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 6px;
          color: var(--accent-color);
          line-height: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .unit {
          font-size: 0.75rem;
          font-weight: 500;
          margin-left: 4px;
          opacity: 0.8;
          text-transform: lowercase;
        }

        .streak-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          line-height: 1.3;
          letter-spacing: 0.025em;
        }

        .achievement-banner {
          background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          box-shadow: 
            0 10px 25px -5px rgba(16, 185, 129, 0.4),
            0 8px 10px -6px rgba(16, 185, 129, 0.2);
          animation: achievementPulse 3s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        
        .achievement-banner::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: shimmer 2s infinite;
        }

        .achievement-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        
        .achievement-icon-container {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          padding: 8px;
          backdrop-filter: blur(10px);
        }

        .achievement-icon {
          font-size: 1.5rem;
          animation: bounce 2s infinite;
          display: block;
        }

        .achievement-text {
          font-weight: 700;
          font-size: 0.95rem;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          letter-spacing: 0.025em;
        }
        
        .achievement-sparkles {
          position: absolute;
          top: 10px;
          right: 15px;
          display: flex;
          gap: 8px;
        }
        
        .sparkle {
          font-size: 0.8rem;
          animation: sparkle 1.5s ease-in-out infinite;
          opacity: 0.8;
        }
        
        .sparkle:nth-child(2) {
          animation-delay: 0.5s;
        }
        
        .sparkle:nth-child(3) {
          animation-delay: 1s;
        }

        @keyframes achievementPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 
              0 10px 25px -5px rgba(16, 185, 129, 0.4),
              0 8px 10px -6px rgba(16, 185, 129, 0.2);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 
              0 15px 35px -5px rgba(16, 185, 129, 0.5),
              0 12px 15px -6px rgba(16, 185, 129, 0.3);
          }
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          40% {
            transform: translateY(-6px) rotate(-5deg);
          }
          60% {
            transform: translateY(-3px) rotate(5deg);
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .streak-tracker {
            padding: 24px 20px;
            margin: 0px 0 16px 0;
          }
          
          .title {
            font-size: 1.2rem;
          }
          
          .subtitle {
            font-size: 0.85rem;
          }
          
          .streak-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
          }
          
          .streak-item {
            padding: 16px 12px;
          }
          
          .streak-icon {
            font-size: 1.5rem;
          }
          
          .streak-value {
            font-size: 1.3rem;
          }
          
          .achievement-banner {
            padding: 16px;
          }
          
          .achievement-text {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 480px) {
          .streak-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .achievement-content {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default StreakTracker;
