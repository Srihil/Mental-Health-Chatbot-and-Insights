import React, { useEffect, useState } from "react";
import axios from "axios";
import { Brain, TrendingUp, TrendingDown, Calendar } from "lucide-react";

const MoodInsightsCard = ({ userId }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`/api/insights/emotional-journey/${userId}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("❌ Failed to fetch emotional journey:", err);
      });
  }, [userId]);

  if (!data) return null;

  return (
    <>
      <style jsx>{`
        .mood-insights-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          padding: 24px;
          border-radius: 20px;
          margin-top: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          max-width: 100%;
        }
        
        .mood-insights-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        
        .decorative-bg {
          position: absolute;
          top: -50px;
          right: -50px;
          width: 120px;
          height: 120px;
          background: linear-gradient(45deg, #ddd6fe, #e0e7ff);
          border-radius: 50%;
          opacity: 0.3;
          z-index: 0;
        }
        
        .content-wrapper {
          position: relative;
          z-index: 1;
        }
        
        .title1 {
          margin-bottom: 35px;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.025em;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .insights-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 16px;
        }
        
        .insight-item {
          font-size: 1rem;
          color: #475569;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 16px;
          font-weight: 500;
          transition: all 0.3s ease;
          cursor: default;
          display: flex;
          align-items: center;
          gap: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .insight-item:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateX(4px);
        }
        
        .insight-item.mood-boost {
          border-left: 4px solid #22c55e;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(255, 255, 255, 0.8));
        }
        
        .insight-item.peak-joy {
          border-left: 4px solid #3b82f6;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(255, 255, 255, 0.8));
        }
        
        .insight-item.lowest-point {
          border-left: 4px solid #f59e0b;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(255, 255, 255, 0.8));
        }
        
        .insight-item.common-themes {
          border-left: 4px solid #8b5cf6;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(255, 255, 255, 0.8));
        }
        
        .icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          flex-shrink: 0;
        }
        
        .mood-boost .icon-wrapper {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        
        .peak-joy .icon-wrapper {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        
        .lowest-point .icon-wrapper {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        
        .common-themes .icon-wrapper {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }
        
        .insight-text {
          flex: 1;
          line-height: 1.5;
        }
        
        .insight-value {
          font-weight: 600;
          color: #1e293b;
        }
        
        @media (max-width: 768px) {
          .mood-insights-card {
            padding: 20px;
            margin: 16px;
            border-radius: 16px;
          }
          
          .title1 {
            font-size: 1.25rem;
            margin-bottom: 20px;
          }
          
          .insight-item {
            padding: 14px 16px;
            font-size: 0.9rem;
          }
          
          .insights-list {
            gap: 12px;
          }
        }
        
        @media (max-width: 480px) {
          .mood-insights-card {
            padding: 16px;
            margin: 12px;
          }
          
          .insight-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            text-align: left;
          }
          
          .icon-wrapper {
            align-self: flex-start;
          }
        }
      `}</style>
      
      <div className="mood-insights-card">
        <div className="decorative-bg"></div>
        
        <div className="content-wrapper">
          <h3 className="title1">
            <Brain size={24} color="#8b5cf6" />
            Your Emotional Journey
          </h3>
          
          <ul className="insights-list">
            <li className="insight-item mood-boost">
              <div className="icon-wrapper">
                <TrendingUp size={18} />
              </div>
              <div className="insight-text">
                Mood Boost: <span className="insight-value">+{data.moodBoost || 0}%</span> since last week
              </div>
            </li>
            
            <li className="insight-item peak-joy">
              <div className="icon-wrapper">
                <Calendar size={18} />
              </div>
              <div className="insight-text">
                Peak Joy: <span className="insight-value">{data.peakDayTime}</span>
              </div>
            </li>
            
            <li className="insight-item lowest-point">
              <div className="icon-wrapper">
                <TrendingDown size={18} />
              </div>
              <div className="insight-text">
                Lowest Point: <span className="insight-value">{data.lowDayTime}</span>
              </div>
            </li>
            
            <li className="insight-item common-themes">
              <div className="icon-wrapper">
                <Brain size={18} />
              </div>
              <div className="insight-text">
                Common Themes: <span className="insight-value">
                  {data.themes?.length ? data.themes.join(", ") : "None detected"}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default MoodInsightsCard;
