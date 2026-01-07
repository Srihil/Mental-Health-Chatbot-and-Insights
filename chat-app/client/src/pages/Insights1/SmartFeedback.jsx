// components/RightSidebar/SmartFeedback.jsx
import React from "react";
import EmotionBreakdown from "../RightInsights/EmotionBreakdown";
import DailyInspiration from "../RightInsights/DailyInspiration";
import PersonalizedRecommendations from "../RightInsights/PersonalizedRecommendations";
import HelpfulResources from "../RightInsights/HelpfulResources";
import MoodProgressGauge from "../RightInsights/MoodProgressGauge";
import SupportiveMemoryMessage from "../RightInsights/SupportiveMemoryMessage";
import StreakTracker from "../RightInsights/StreakTracker";
import { useContext } from "react";
import { AppContext } from "../../context/AppContext";

const SmartFeedback = () => {
  const { userData } = useContext(AppContext); // ✅ Get userData safely
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <EmotionBreakdown />
      <MoodProgressGauge /> 
      <DailyInspiration />
      <SupportiveMemoryMessage />
      <PersonalizedRecommendations />
      <StreakTracker /> 
      {/* <HelpfulResources /> */}
    </div>
  );
};

export default SmartFeedback;
