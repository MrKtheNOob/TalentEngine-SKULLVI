import os
from collections.abc import Iterable

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam


class LLMService:
    def __init__(self) -> None:
        api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        self.model = os.getenv("OPENROUTER_MODEL", "").strip()
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY is required to use the LLM service.")
        if not self.model:
            raise RuntimeError("OPENROUTER_MODEL is required to use the LLM service.")

        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            timeout=60.0,
        )

    async def complete(self, messages: Iterable[ChatCompletionMessageParam]) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
        )
        if not response.choices:
            raise RuntimeError("The LLM returned no response choices.")
        choice = response.choices[0]
        if choice.finish_reason != "stop":
            raise RuntimeError(f"The LLM did not finish its response: {choice.finish_reason}.")
        content = choice.message.content
        if not content or not content.strip():
            raise RuntimeError("The LLM returned no text content.")
        return content

    async def close(self) -> None:
        await self.client.close()
