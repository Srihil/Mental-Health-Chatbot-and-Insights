import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart2, LogOut, Menu, MessageSquare, User, X } from "lucide-react";
import UserMoodProfile from "./UserMoodProfile.jsx";
import MoodCharts from "./MoodCharts.jsx";
import SmartFeedback from "./SmartFeedback.jsx";
import "./InsightsPage.css"; // ✅ Added for responsive grid layout

// MenuToggle Component
const MenuToggle = ({ isOpen, toggle }) => (
  <button
    onClick={toggle}
    aria-label={isOpen ? "Close menu" : "Open menu"}
    style={{
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "all 0.2s",
      backgroundColor: "white",
      color: "black",
      border: "none",
      marginRight: "16px",
    }}
  >
    <AnimatePresence mode="wait">
      <motion.div
        key={isOpen ? "close" : "open"}
        initial={{ opacity: 0, rotate: isOpen ? -90 : 90 }}
        animate={{ opacity: 1, rotate: 0 }}
        exit={{ opacity: 0, rotate: isOpen ? 90 : -90 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </motion.div>
    </AnimatePresence>
  </button>
);

// MenuItem Component
const MenuItem = ({ icon, label, onClick = () => {} }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "16px 24px",
      fontSize: "18px",
      backgroundColor: "transparent",
      border: "none",
      cursor: "pointer",
      borderRadius: "8px",
      transition: "background-color 0.2s",
      textAlign: "left",
    }}
    onMouseEnter={(e) => (e.target.style.backgroundColor = "#f1f5f9")}
    onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// SlidingMenu Component
const SlidingMenu = ({ isOpen, onClose, navigate }) => {
  const handleNavigation = (destination) => {
    navigate(`/${destination}`);
    onClose();
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 50,
              height: "100%",
              width: window.innerWidth < 400 ? "100vw" : "375px",
              backgroundColor: "white",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                padding: "24px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  marginBottom: "24px",
                  height: "20px",
                }}
              ></h2>
              <MenuItem
                icon={<MessageSquare size={24} />}
                label="Chat"
                onClick={() => handleNavigation("chat")}
              />
              <MenuItem
                icon={<BarChart2 size={24} />}
                label="Insights"
                onClick={() => handleNavigation("insights")}
              />
              <MenuItem
                icon={<User size={24} />}
                label="Profile"
                onClick={() => handleNavigation("profile")}
              />
              <div style={{ marginTop: "auto" }}>
                <MenuItem
                  icon={<LogOut size={24} />}
                  label="Log Out"
                  onClick={handleLogout}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Insights Page
const InsightsPage = ({ className = "" }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const styles = {
    container: {
      minHeight: "100vh",
      padding: "32px 16px",
      background:
        "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f3e8ff 100%)",
      display: "grid",
      gridTemplateColumns: "1fr 2fr 1fr",
      gap: "32px",
      alignItems: "stretch",
    },
    card: {
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(8px)",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      width: "100%",
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
    header: {
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid #e2e8f0",
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    headerContainer: {
      width: "100%",
      margin: "0 auto",
      padding: "24px 20px",
    },
    headerContent: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    title: {
      fontSize: "2.5rem",
      fontWeight: "bold",
      background: "linear-gradient(to right, #2563eb, #7c3aed)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      margin: 0,
    },
    subtitle: {
      color: "#64748b",
      fontSize: "1.125rem",
      margin: 0,
    },
    badges: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
    },
    badge: {
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "0.875rem",
      fontWeight: "500",
    },
    badgeGreen: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
    badgeBlue: {
      backgroundColor: "#dbeafe",
      color: "#1e40af",
    },
  };

  const navigate = (url) => {
    window.location.href = url;
  };

  const mediaQueries = `
  @media (max-width: 767px) {
    .responsive-header h1 {
      font-size: 1.8rem !important;
    }

    .responsive-header p {
      font-size: 1rem !important;
    }

    .header-wrapper {
      position: relative !important;
    }
  }

  @media (min-width: 768px) {
    .header-content-md {
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;
    }
  }

  .header-wrapper {
    width: 100% !important;
    box-sizing: border-box;
  }
`;

  return (
    <>
      <style>{mediaQueries}</style>

      {/* Header */}
      <div style={styles.header} className="header-wrapper">
        <div style={styles.headerContainer}>
          <div
            style={{ ...styles.headerContent }}
            className="header-content-md"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "16rem",
              }}
            >
              <MenuToggle
                isOpen={menuOpen}
                toggle={() => setMenuOpen(!menuOpen)}
              />
              <div className="responsive-header">
                <h1 style={styles.title}>Mood Insights Dashboard</h1>
                <p style={styles.subtitle}>
                  Discover patterns in your emotional journey and get
                  personalized recommendations
                </p>
              </div>
            </div>
            <div style={styles.badges}>
              <div style={{ ...styles.badge, ...styles.badgeGreen }}>
                ✨ AI-Powered
              </div>
              <div style={{ ...styles.badge, ...styles.badgeBlue }}>
                📊 Real-time
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={styles.container} className={`insights-grid ${className}`}>
        <div style={{ maxWidth: "350px", width: "100%" }}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>👤 Personal Dashboard</h2>
            </div>
            <div style={{ flex: 1 }}>
              <UserMoodProfile />
            </div>
          </div>
        </div>

        <div>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>📊 Analytics & Insights</h2>
            </div>
            <div style={{ flex: 1, padding: "24px" }}>
              <MoodCharts />
            </div>
          </div>
        </div>

        <div>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>🤖 Smart Feedback</h2>
            </div>
            <div style={{ flex: 1 }}>
              <SmartFeedback />
            </div>
          </div>
        </div>
      </div>

      <SlidingMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        navigate={navigate}
      />
    </>
  );
};

export default InsightsPage;
