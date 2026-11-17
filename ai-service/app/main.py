from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(
    title="SmartCampus AI Service",
    description="AI service for the SmartCampus platform",
    version="1.0.0"
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "message": "SmartCampus AI Service is running!",
        "status": "healthy"
    }