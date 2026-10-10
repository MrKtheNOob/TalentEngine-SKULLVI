import os
import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from shared.llm_service import LLMService


class TestLLMService:
    @pytest.fixture(autouse=True)
    def setup(self, monkeypatch):
        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        monkeypatch.setenv("OPENROUTER_MODEL", "test/model")
        with patch("shared.llm_service.AsyncOpenAI") as self.client_class:
            self.client = self.client_class.return_value
            self.client.chat.completions.create = AsyncMock()
            self.client.close = AsyncMock()
            self.service = LLMService()
            yield

    def response(self, content, finish_reason="stop"):
        return SimpleNamespace(choices=[SimpleNamespace(
            finish_reason=finish_reason,
            message=SimpleNamespace(content=content),
        )])

    async def test_completion_uses_openrouter_and_selected_model(self):
        self.client_class.assert_called_once_with(
            api_key="test-key", base_url="https://openrouter.ai/api/v1", timeout=60.0,
        )
        messages = [{"role": "user", "content": "Test submission"}]
        self.client.chat.completions.create.return_value = self.response("Answer")
        assert await self.service.complete(messages) == "Answer"
        self.client.chat.completions.create.assert_awaited_once_with(
            model="test/model", messages=messages,
        )

    def test_missing_settings_raise_clear_errors(self, subtests):
        for setting in ("OPENROUTER_API_KEY", "OPENROUTER_MODEL"):
            with subtests.test(setting=setting), patch.dict(os.environ, {setting: " "}):
                with pytest.raises(RuntimeError, match=setting):
                    LLMService()

    async def test_empty_or_incomplete_responses_are_not_successful(self, subtests):
        responses = [
            SimpleNamespace(choices=[]),
            self.response(None), self.response(" "),
            self.response("Partial JSON", "length"),
            self.response(None, "content_filter"),
        ]
        for response in responses:
            with subtests.test(response=response):
                self.client.chat.completions.create.return_value = response
                with pytest.raises(RuntimeError):
                    await self.service.complete([])

    async def test_provider_errors_propagate_and_client_can_be_closed(self):
        error = RuntimeError("Provider unavailable")
        self.client.chat.completions.create.side_effect = error
        with pytest.raises(RuntimeError) as raised:
            await self.service.complete([])
        assert raised.value is error
        await self.service.close()
        self.client.close.assert_awaited_once()
