// components/RightSidebar/HelpfulResources.jsx
import React from "react";

const HelpfulResources = () => {
  const styles = {
    card: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      marginBottom: "16px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    header: {
      padding: "16px 20px 8px",
      borderBottom: "1px solid #f1f5f9",
      fontSize: "1.125rem",
      fontWeight: 500,
    },
    content: {
      padding: "20px",
    },
    badge: {
      padding: "6px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      fontSize: "0.75rem",
      marginBottom: "8px",
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      cursor: "pointer",
    },
  };

  const resources = [
    "Meditation Guide",
    "Stress Management",
    "Sleep Tips",
    "Journaling Prompts",
  ];

  return (
    <div style={styles.card}>
      <div style={styles.header}>Helpful Resources</div>
      <div style={styles.content}>
        {resources.map((text, i) => (
          <div key={i} style={styles.badge}>
            {text} 🔗
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpfulResources;
