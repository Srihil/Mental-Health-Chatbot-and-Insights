import React, { useContext, useEffect, useState } from "react";
import dayjs from "dayjs";
import axios from "../../config/api";
import { AppContext } from "../../context/AppContext";

// Mood to color mapping
const moodColorMap = {
  happy: "#34d399",
  excited: "#06b6d4",
  grateful: "#fde68a",
  calm: "#60a5fa",
  neutral: "#d1d5db",
  bored: "#a78bfa",
  tired: "#fbbf24",
  frustrated: "#f97316",
  anxious: "#f87171",
  sad: "#94a3b8",
  others: "#e5e7eb",
};

const getMoodColor = (mood) => moodColorMap[mood] || moodColorMap["others"];

const ChatActivityHeatmap = () => {
  const { userData, chatData } = useContext(AppContext);
  const [heatmapData, setHeatmapData] = useState([]);
  const [tooltip, setTooltip] = useState({
    show: false,
    date: null,
    content: "",
  });

  useEffect(() => {
    const fetchChatActivity = async () => {
      if (!userData || !chatData?.length) return;

      const botChats = chatData.filter((c) => c.rId === "bot");
      const messageIds = botChats.map((c) => c.messageId);
      const moodPerDate = {};

      const results = await Promise.all(
        messageIds.map(async (id) => {
          const res = await axios.get(`/insights/mood-trends/${id}`);
          return res.data?.moodEntries || [];
        })
      );

      results.flat().forEach((entry) => {
        const date = dayjs(entry._id).format("YYYY-MM-DD");
        entry.moods.forEach((m) => {
          if (!moodPerDate[date]) moodPerDate[date] = {};
          moodPerDate[date][m.mood] =
            (moodPerDate[date][m.mood] || 0) + m.count;
        });
      });

      const startDate = dayjs().startOf("month");
      const endDate = startDate.add(2, "month").subtract(1, "day");

      const mapped = [];

      for (
        let date = startDate.clone();
        date.isBefore(endDate) || date.isSame(endDate, "day");
        date = date.add(1, "day")
      ) {
        const str = date.format("YYYY-MM-DD");
        const moodCounts = moodPerDate[str];
        let dominantMood = "others";
        let totalCount = 0;

        if (moodCounts) {
          const sortedMoods = Object.entries(moodCounts).sort(
            (a, b) => b[1] - a[1]
          );
          dominantMood = sortedMoods[0][0];
          totalCount = Object.values(moodCounts).reduce(
            (sum, count) => sum + count,
            0
          );
        }

        mapped.push({
          date: str,
          mood: dominantMood,
          count: totalCount,
          day: date.date(),
          month: date.format("MMM"),
          isFirstOfMonth: date.date() === 1,
        });
      }

      setHeatmapData(mapped);
    };

    fetchChatActivity();
  }, [userData, chatData]);

  const handleCellHover = (event, data) => {
    setTooltip({
      show: true,
      date: data.date,
      content:
        data.count > 0
          ? `${data.date}: ${data.count} activities - ${data.mood}`
          : `${data.date}: No data`,
    });
  };

  const handleCellLeave = () => {
    setTooltip({ show: false, date: null, content: "" });
  };

  const groupByMonths = (data) => {
    const monthsData = {};
    data.forEach((day) => {
      const monthKey = dayjs(day.date).format("YYYY-MM");
      if (!monthsData[monthKey]) {
        monthsData[monthKey] = {
          name: day.month,
          days: [],
          weeks: [],
        };
      }
      monthsData[monthKey].days.push(day);
    });

    Object.keys(monthsData).forEach((monthKey) => {
      const monthData = monthsData[monthKey];
      const weeks = [];
      let currentWeek = [];

      monthData.days.forEach((day, index) => {
        const dayOfWeek = dayjs(day.date).day();

        if (index === 0) {
          for (let i = 0; i < dayOfWeek; i++) {
            currentWeek.push(null);
          }
        }

        currentWeek.push(day);

        if (dayOfWeek === 6 || index === monthData.days.length - 1) {
          while (currentWeek.length < 7) {
            currentWeek.push(null);
          }
          weeks.push(currentWeek);
          currentWeek = [];
        }
      });

      monthData.weeks = weeks;
    });

    return Object.values(monthsData);
  };

  const monthsData = groupByMonths(heatmapData);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h3>Chat Activity Heatmap</h3>
        <div className="months-subtitle">
          {monthsData.map((month, index) => (
            <span key={month.name} className="month-title">
              {month.name}
              {index < monthsData.length - 1 && " • "}
            </span>
          ))}
        </div>
      </div>

      <div className="horizontal-months-grid">
        {monthsData.map((monthData, monthIndex) => (
          <div key={monthData.name} className="month-container">
            <div className="month-header">
              <h4 className="month-name">{monthData.name}</h4>
            </div>

            <div className="month-calendar">
              <div className="weekday-labels">
                {weekdays.map((day) => (
                  <div key={day} className="weekday-label">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calendar-grid">
                {monthData.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="week-row">
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${monthIndex}-${weekIndex}-${dayIndex}`}
                        className={`day-cell ${day ? "has-data" : "empty"}`}
                        style={{
                          backgroundColor: day
                            ? getMoodColor(day.mood)
                            : "transparent",
                        }}
                        onMouseEnter={
                          day ? (e) => handleCellHover(e, day) : undefined
                        }
                        onMouseLeave={handleCellLeave}
                      >
                        {day && (
                          <>
                            <span className="day-number">{day.day}</span>
                            {day.count > 0 && (
                              <span className="activity-count">
                                {day.count}
                              </span>
                            )}
                            {tooltip.show && tooltip.date === day.date && (
                              <div className="tooltip1">{tooltip.content}</div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .heatmap-container {
          padding: 20px;
          background: #ffffff;
          max-width: 100%;
          overflow-x: auto;
          white-space: nowrap;
        }

        .heatmap-header {
          margin-bottom: 24px;
          text-align: center;
        }

        .heatmap-header h3 {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .months-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .horizontal-months-grid {
          display: inline-flex;
          gap: 20px;
          flex-wrap: nowrap;
        }

        .month-container {
          min-width: 280px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
        }

        .month-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .month-name {
          font-size: 1.125rem;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .weekday-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .weekday-label {
          width: 32px;
          text-align: center;
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 600;
        }

        .calendar-grid {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .week-row {
          display: flex;
          gap: 3px;
        }

        .day-cell {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .day-cell.has-data:hover {
          transform: scale(1.15);
          z-index: 10;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
        }

        .day-cell.empty {
          background: transparent;
          border: none;
          box-shadow: none;
          cursor: default;
        }

        .day-number {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1f2937;
        }

        .activity-count {
          font-size: 0.625rem;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 8px;
          padding: 1px 4px;
          margin-top: 1px;
        }

        .tooltip1 {
          position: absolute;
          bottom: 110%;
          left: 50%;
          transform: translateX(-50%);
          background: #1f2937;
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          pointer-events: none;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .tooltip1::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: #1f2937;
        }
      `}</style>
    </div>
  );
};

export default ChatActivityHeatmap;
