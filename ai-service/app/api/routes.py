from fastapi import APIRouter

router = APIRouter(prefix="/api/v1", tags=["Health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service"
    }


@router.get("/test")
async def test():
    return {
        "message": "API is working correctly!"
    }