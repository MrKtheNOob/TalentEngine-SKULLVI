import asyncio
import io
import socket
import pytest
from unittest.mock import AsyncMock, patch

import httpx

from pypdf import PdfWriter
from jobs.cv_reader import CVReader


class TestCVReader:
    async def test_non_https_and_private_addresses_are_rejected(self):
        reader = CVReader()
        for url in ("http://example.com/cv.pdf", "file:///etc/passwd", "https://user:password@example.com/cv.pdf"):
            with pytest.raises(ValueError):
                await reader._check_url(url)
        loop = asyncio.get_running_loop()
        with patch.object(loop, "getaddrinfo", new=AsyncMock(return_value=[
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 443)),
        ])):
            with pytest.raises(ValueError):
                await reader._check_url("https://localhost/cv.pdf")

    def blank_pdf(self):
        writer = PdfWriter()
        writer.add_blank_page(width=100, height=100)
        content = io.BytesIO()
        writer.write(content)
        return content.getvalue()

    async def read_pdf(self, reader, pdf):
        transport = httpx.MockTransport(lambda request: httpx.Response(200, content=pdf))
        client = httpx.AsyncClient(transport=transport)
        with patch('jobs.cv_reader.httpx.AsyncClient', return_value=client), patch.object(reader, '_check_url', new=AsyncMock()):
            return await reader.read('https://example.com/cv.pdf')

    async def test_scanned_pdf_uses_ocr_fallback(self):
        ocr = AsyncMock()
        ocr.extract_text.return_value = 'Python projects'
        pdf = self.blank_pdf()
        assert await self.read_pdf(CVReader(ocr), pdf) == 'Python projects'
        ocr.extract_text.assert_awaited_once_with(pdf)

    async def test_native_text_skips_ocr(self):
        ocr = AsyncMock()
        reader = CVReader(ocr)
        with patch.object(reader, '_extract_text', return_value='Native PDF text'):
            assert await self.read_pdf(reader, self.blank_pdf()) == 'Native PDF text'
        ocr.extract_text.assert_not_awaited()

    async def test_scanned_pdf_without_ocr_remains_a_review_error(self):
        with pytest.raises(ValueError, match='texte lisible'):
            await self.read_pdf(CVReader(), self.blank_pdf())

    async def test_malformed_pdf_does_not_trigger_ocr(self):
        ocr = AsyncMock()
        with pytest.raises(Exception):
            await self.read_pdf(CVReader(ocr), b'%PDF-broken')
        ocr.extract_text.assert_not_awaited()

    async def test_ocr_failure_is_not_returned_as_cv_text(self):
        ocr = AsyncMock()
        ocr.extract_text.side_effect = ValueError('OCR unavailable')
        with pytest.raises(ValueError, match='OCR unavailable'):
            await self.read_pdf(CVReader(ocr), self.blank_pdf())
