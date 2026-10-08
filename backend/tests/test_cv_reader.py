import asyncio
import io
import socket
import unittest
from unittest.mock import AsyncMock, patch

from pypdf import PdfWriter
from jobs.cv_reader import CVReader


class CVReaderTests(unittest.IsolatedAsyncioTestCase):
    async def test_non_https_and_private_addresses_are_rejected(self):
        reader = CVReader()
        for url in ("http://example.com/cv.pdf", "file:///etc/passwd", "https://user:password@example.com/cv.pdf"):
            with self.assertRaises(ValueError):
                await reader._check_url(url)
        loop = asyncio.get_running_loop()
        with patch.object(loop, "getaddrinfo", new=AsyncMock(return_value=[
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 443)),
        ])):
            with self.assertRaises(ValueError):
                await reader._check_url("https://localhost/cv.pdf")

    def test_scanned_or_empty_pdf_does_not_silently_normalize(self):
        writer = PdfWriter()
        writer.add_blank_page(width=100, height=100)
        content = io.BytesIO()
        writer.write(content)
        with self.assertRaisesRegex(ValueError, "texte lisible"):
            CVReader()._extract_text(content.getvalue())
