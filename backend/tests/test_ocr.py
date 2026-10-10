import base64
import pytest
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

from shared.ocr_service import OCRService


class TestOCRService:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.create = AsyncMock()
        self.llm = SimpleNamespace(model='test/model', client=SimpleNamespace(
            chat=SimpleNamespace(completions=SimpleNamespace(create=self.create))))
        self.service = OCRService(self.llm)

    def response(self, annotations):
        message = Mock()
        message.model_dump.return_value = {'content': 'OK', 'annotations': annotations}
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])

    async def test_pdf_is_sent_to_ocr_and_parser_text_is_used(self):
        self.create.return_value = self.response([{'type': 'file', 'file': {'content': [
            {'type': 'text', 'text': 'Python developer'},
            {'type': 'image_url', 'image_url': {'url': 'ignored'}},
            {'type': 'text', 'text': 'API projects'},
        ]}}])
        pdf = b'%PDF-sample'
        assert await self.service.extract_text(pdf) == 'Python developer\nAPI projects'
        request = self.create.call_args.kwargs
        assert request['model'] == 'test/model'
        assert request['extra_body']['plugins'][0]['pdf']['engine'] == 'mistral-ocr'
        data = request['messages'][0]['content'][1]['file']['file_data']
        assert base64.b64decode(data.split(',', 1)[1]) == pdf

    async def test_missing_or_blank_parser_text_is_not_a_success(self):
        for annotations in [None, [], [{'type': 'file', 'file': {'content': [{'type': 'text', 'text': ' '}]}}]]:
            self.create.return_value = self.response(annotations)
            with pytest.raises(ValueError, match='aucun texte'):
                await self.service.extract_text(b'%PDF-sample')
        self.create.return_value = SimpleNamespace(choices=[])
        with pytest.raises(ValueError, match='aucun résultat'):
            await self.service.extract_text(b'%PDF-sample')

    async def test_provider_failure_propagates_to_application_warning_handler(self):
        self.create.side_effect = RuntimeError('Provider unavailable')
        with pytest.raises(RuntimeError, match='Provider unavailable'):
            await self.service.extract_text(b'%PDF-sample')
