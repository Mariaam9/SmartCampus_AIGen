
import httpx

from app.core.config import settings


class LLMConnectionError(Exception):
    pass


class LLMTimeoutError(Exception):
    pass


class LLMService:

    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL

    async def generate_response(self, messages: list[dict]) -> str:

        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": settings.LLM_TEMPERATURE,
                "num_predict": settings.LLM_MAX_TOKENS
            }
        }

        try:
            async with httpx.AsyncClient(
                timeout=settings.LLM_TIMEOUT
            ) as client:

                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )

                response.raise_for_status()
                data = response.json()

                return data["message"]["content"]

        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(
                "The LLM response timed out."
            ) from exc

        except httpx.ConnectError as exc:
            raise LLMConnectionError(
                "Cannot connect to Ollama."
            ) from exc

        except httpx.HTTPStatusError as exc:
            raise LLMConnectionError(
                f"Ollama returned HTTP {exc.response.status_code}."
            ) from exc


llm_service = LLMService()
