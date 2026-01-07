import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import dayjs from "dayjs";

const MoodPredictionTimeline = ({ data = [] }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const { moodScore, reason, confidence, source } = payload[0].payload;
      return (
        <div className="mood-tooltip">
          <div className="tooltip-header">
            <strong>{dayjs(label).format("MMM D, h:mm A")}</strong>
          </div>
          <div className="tooltip-content">
            {source === "forecast" && (
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  color: "#22c55e",
                }}
              >
                📈 Forecasted
              </div>
            )}
            <div className="mood-score">
              <span className="label">Mood Score:</span>
              <span className="value">
                {typeof moodScore === "number" ? moodScore.toFixed(1) : "N/A"}
              </span>
            </div>
            <div className="confidence">
              <span className="label">Confidence:</span>
              <span className="value">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="reason">{reason}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDot = ({ cx, cy, payload }) => {
    const { confidence, source } = payload;
    const isForecast = source === "forecast";
    const opacity = isForecast ? 1 : Math.max(0.3, confidence);

    return (
      <circle
        cx={cx}
        cy={cy}
        r={isForecast ? 6 : 4}
        fill={isForecast ? "#22c55e" : "#0ea5e9"}
        stroke="#ffffff"
        strokeWidth={2}
        opacity={opacity}
        className="mood-dot"
      />
    );
  };

  return (
    <div className="mood-prediction-timeline">
      <div className="chart-header">
        <h3 className="chart-title">Mood Prediction Timeline</h3>
        <div className="chart-legend">
          <div className="legend-item">
            <div
              className="legend-color"
              style={{ background: "#0ea5e9" }}
            ></div>
            <span>Actual Mood Score</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-color"
              style={{ background: "#22c55e" }}
            ></div>
            <span>Forecasted Mood</span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: -15, bottom: 20 }}
          >
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              opacity={0.6}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => dayjs(value).format("MMM D")}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              padding={{ right: 40 }} // 👈 ADD THIS
            />
            <YAxis
              domain={[0, 10]}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="moodScore"
              stroke="#0ea5e9"
              strokeWidth={3}
              fill="url(#moodGradient)"
            />
            <Line
              type="monotone"
              dataKey="moodScore"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={<CustomDot />}
              strokeDasharray="0" // solid line for now
              activeDot={{
                r: 6,
                stroke: "#0ea5e9",
                strokeWidth: 2,
                fill: "#ffffff",
              }}
              isAnimationActive={false}
            />
            
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-footer">
        <p className="chart-description">
          Mood predictions based on historical patterns and current trends
        </p>
      </div>

      <style jsx>{`
        .mood-prediction-timeline {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          margin: 16px 0;
          transition: all 0.3s ease;
        }

        .mood-prediction-timeline:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .chart-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          background: linear-gradient(135deg, #0ea5e9, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .chart-legend {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #64748b;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .chart-container {
          padding: 0;
          background: white;
          border-radius: 12px;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
          border: 1px solid #f1f5f9;
        }

        .chart-footer {
          margin-top: 16px;
          text-align: center;
        }

        .chart-description {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
          font-style: italic;
        }

        .mood-tooltip {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
          min-width: 200px;
        }

        .tooltip-header {
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mood-score,
        .confidence {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label {
          color: #64748b;
          font-size: 0.875rem;
        }

        .value {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.875rem;
        }

        .reason {
          color: #64748b;
          font-size: 0.8125rem;
          font-style: italic;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
          line-height: 1.4;
        }

        .mood-dot {
          transition: all 0.2s ease;
        }

        .mood-dot:hover {
          r: 6;
          opacity: 1;
        }

        @media (max-width: 768px) {
          .mood-prediction-timeline {
            padding: 16px;
            margin: 12px 0;
          }

          .chart-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .chart-title {
            font-size: 1.25rem;
          }

          .mood-tooltip {
            min-width: 180px;
            padding: 12px;
          }
        }

        @media (max-width: 480px) {
          .mood-prediction-timeline {
            padding: 12px;
          }

          .chart-title {
            font-size: 1.125rem;
          }

          .legend-item {
            font-size: 0.8125rem;
          }

          .mood-tooltip {
            min-width: 160px;
            padding: 10px;
          }
        }
      `}</style>
    </div> 
  );
};

export default MoodPredictionTimeline;
