import React, { useState } from "react";

const DailyInspiration = () => {
  const quotes = [
    {
      text: "Happiness is not something ready-made. It comes from your own actions.",
      author: "Dalai Lama",
    },
    {
      text: "The best way to predict the future is to create it.",
      author: "Abraham Lincoln",
    },
    {
      text: "In the middle of difficulty lies opportunity.",
      author: "Albert Einstein",
    },
    {
      text: "You are never too old to set another goal or to dream a new dream.",
      author: "C.S. Lewis",
    },
    {
      text: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt",
    },
    {
      text: "Start where you are. Use what you have. Do what you can.",
      author: "Arthur Ashe",
    },
    {
      text: "Difficult roads often lead to beautiful destinations.",
      author: "Zig Ziglar",
    },
    {
      text: "Embrace the glorious mess that you are.",
      author: "Elizabeth Gilbert",
    },
    {
      text: "Small steps in the right direction can turn out to be the biggest step of your life.",
      author: "Naeem Callaway",
    },
    {
      text: "Healing takes time, and asking for help is a courageous step.",
      author: "Mariska Hargitay",
    },
  ];

  const [quote, setQuote] = useState(quotes[0]);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);

    let newQuote;
    do {
      newQuote = quotes[Math.floor(Math.random() * quotes.length)];
    } while (newQuote.text === quote.text); // prevent immediate repeat

    setQuote(newQuote);
    setRefreshing(false);
  };

  const styles = {
    card: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      marginBottom: "16px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px 8px",
      borderBottom: "1px solid #f1f5f9",
      fontSize: "1.125rem",
      fontWeight: 500,
    },
    button: {
      cursor: "pointer",
      background: "transparent",
      border: "none",
      fontSize: "1.1rem",
      transition: "transform 0.4s ease",
    },
    quote: {
      padding: "20px",
      fontStyle: "italic",
      fontSize: "0.95rem",
      color: "#374151",
    },
    author: {
      marginTop: "8px",
      fontSize: "0.875rem",
      color: "#64748b",
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span>Daily Inspiration</span>
        <button
          style={{
            ...styles.button,
            transform: refreshing ? "rotate(360deg)" : "none",
          }}
          onClick={refresh}
          disabled={refreshing}
        >
          🔄
        </button>
      </div>
      <div style={styles.quote}>
        “{quote.text}”
        <div style={styles.author}>— {quote.author}</div>
      </div>
    </div>
  );
};

export default DailyInspiration;
