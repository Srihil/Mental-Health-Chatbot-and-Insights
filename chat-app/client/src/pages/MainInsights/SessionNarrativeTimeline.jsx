import React, { useEffect, useState, useContext } from "react";
import axios from "../../config/api";
import { AppContext } from "../../context/AppContext";

const SessionNarrativeTimeline = () => {
  const { userData } = useContext(AppContext);
  const [narrative, setNarrative] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNarrative = async () => {
      if (!userData?._id) return;
      try {
        const res = await axios.get(`/insights/session-narrative/${userData._id}`);
        setNarrative(res.data.narrative || []);
      } catch (err) {
        console.error("Failed to fetch narrative:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNarrative();
  }, [userData]);

  if (loading) return <p>Loading session narrative...</p>;

  if (!narrative.length) return <p>No mood story yet.</p>;

  return (
    <div className="narrative-timeline">
      <h3>🧠 Mood Story Timeline</h3>
      <ul>
        {narrative.map((entry, idx) => (
          <li key={idx}>
            <strong>{entry.time}</strong> – <em>{entry.mood}</em>: “{entry.text}”
          </li>
        ))}
      </ul>

      <style>{`
        .narrative-timeline {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-top: 1rem;
        }
        .narrative-timeline h3 {
          margin-bottom: 1rem;
          color: #333;
        }
        .narrative-timeline ul {
          list-style: none;
          padding: 0;
        }
        .narrative-timeline li {
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
          color: #444;
        }
        .narrative-timeline em {
          color: #6366f1;
          font-style: normal;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default SessionNarrativeTimeline;
  