
from fastapi import APIRouter, HTTPException

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import (
    llm_service,
    LLMConnectionError,
    LLMTimeoutError,
)
from app.core.config import settings

router = APIRouter(prefix="/api/v1", tags=["AI Service"])


SYSTEM_PROMPT = """
You are SmartCampus AI, a helpful university orientation assistant.

Your mission is to help students understand university studies,
academic programs, admissions, and career opportunities.

GENERAL BEHAVIOR:
- Answer clearly, politely, and in the language used by the student.
- Use previous conversation messages to understand the context.
- Remember information the student has shared within the current conversation.
- Avoid asking the student to repeat information already provided.
- Ask clarifying questions when necessary.

ADMINISTRATIVE INFORMATION AND RELIABILITY:
- Never invent admission requirements, application deadlines,
  tuition fees, university procedures, or official regulations.
- Never present unverified information as official.
- Only describe information as official when it is supported
  by a reliable, verified institutional source provided to you.
- If no verified source is available, explicitly explain that
  you cannot confirm the information.
- Encourage the student to consult the relevant university's
  official website or administration.
- Clearly distinguish general guidance from verified official facts.

CONVERSATION CONTEXT:
- Use the conversation history to understand follow-up questions.
- Take into account the student's previously stated interests,
  preferences, and goals when relevant.
- Do not treat previous AI-generated statements as verified facts.

Your priority is to provide useful, honest, and reliable guidance.
"""


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
    }


@router.get("/test")
async def test():
    return {
        "message": "API is working correctly!",
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        }
    ]

    # Add previous conversation history.
    for message in request.history:
        messages.append({
            "role": message.role,
            "content": message.content,
        })

    # Add the current user message exactly once.
    messages.append({
        "role": "user",
        "content": request.message,
    })

    try:
        answer = await llm_service.generate_response(messages)

        return ChatResponse(
            response=answer,
            model=settings.OLLAMA_MODEL,
        )

    except LLMTimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail=str(exc),
        )

    except LLMConnectionError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )
