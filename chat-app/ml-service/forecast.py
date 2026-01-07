from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
from prophet import Prophet

router = APIRouter()

MOOD_RANGES = {
    (0, 1.5): "frustrated",
    (1.5, 3): "anxious",
    (3, 4): "bored",
    (4, 5.5): "neutral",
    (5.5, 7): "calm",
    (7, 8.5): "grateful",
    (8.5, 10): "happy"
}

class History(BaseModel):
    history: list[dict]  # expects [{"ds": "2024-07-09", "y": 6.5}, ...]

@router.post("/forecast")
async def forecast_mood(data: History):
    df = pd.DataFrame(data.history)

    if df.empty or len(df) < 5:
        return {
            "prediction": "neutral",
            "confidence": 0.4,
            "reason": "📉 Not enough data to forecast mood."
        }

    try:
        # 🔄 Group by date & average scores
        df['ds'] = pd.to_datetime(df['ds'])
        daily_avg = df.groupby('ds').mean().reset_index()

        model = Prophet(daily_seasonality=True)
        model.fit(daily_avg)

        future = model.make_future_dataframe(periods=1)
        forecast = model.predict(future)

        next_day = forecast.iloc[-1]
        yhat_raw = next_day["yhat"]
        yhat = round(min(9, max(0, yhat_raw)))  # ⬅️ Clamped & rounded

        predicted_mood = next(
            mood for (low, high), mood in MOOD_RANGES.items() if low <= yhat < high
        ) if yhat is not None else "neutral"

        return {
            "prediction": predicted_mood,
            "confidence": 0.7,
            "reason": f"📈 Predicted based on recent mood trend. Score: {yhat}",
            "moodScore": yhat
        }

    except Exception as e:
        avg = round(min(9, max(0, df['y'].mean())))  # fallback mood score
        fallback_mood = next(
            mood for (low, high), mood in MOOD_RANGES.items() if low <= avg < high
        )

        return {
            "prediction": fallback_mood,
            "confidence": 0.4,
            "reason": f"📉 Forecasting failed. Using average score {avg} as fallback.",
            "moodScore": avg
        }
