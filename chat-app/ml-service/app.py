from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import analyze_text
from forecast import router as forecast_router

app = FastAPI()

# ✅ Enable CORS for your frontend (localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(forecast_router)

class MessageRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_message(request: MessageRequest):
    result = analyze_text(request.text)
    return result
