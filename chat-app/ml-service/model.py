from textblob import TextBlob

def analyze_text(text):
    text = text.lower().strip()
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity

    # Priority: If user explicitly mentions a mood, we trust it
    keyword_map = {
        "stressed": "anxious",
        "stress": "anxious",
        "tired": "tired",
        "excited": "excited",
        "sad": "sad",
        "happy": "happy",
        "joy": "happy",
        "angry": "frustrated",
        "mad": "frustrated",
        "frustrated": "frustrated",
        "grateful": "grateful",
        "thankful": "grateful",
        "calm": "calm",
        "relaxed": "calm",
        "bored": "bored",
    }

    for keyword, mood in keyword_map.items():
        if keyword in text:
            detected_mood = mood
            break
    else:
        # fallback to polarity if no keyword matched
        if polarity >= 0.5:
            detected_mood = "happy"
        elif 0.2 <= polarity < 0.5:
            detected_mood = "calm"
        elif -0.2 <= polarity < 0.2:
            detected_mood = "neutral"
        elif -0.4 <= polarity < -0.2:
            detected_mood = "bored"
        elif -0.6 <= polarity < -0.4:
            detected_mood = "anxious"
        else:
            detected_mood = "sad"

    sentiment = (
        "positive" if polarity > 0 else
        "negative" if polarity < 0 else
        "neutral"
    )

    confidence = round(abs(polarity), 3)

    return {
        "mood": detected_mood,
        "sentiment": sentiment,
        "confidence": confidence
    }
