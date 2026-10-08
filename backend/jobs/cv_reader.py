import asyncio
import io
import ipaddress
import socket
from urllib.parse import urljoin, urlparse

import httpx
from pypdf import PdfReader


class CVReader:
    MAX_BYTES = 10 * 1024 * 1024

    async def read(self, url: str) -> str:
        # Submitted URLs are untrusted: never download from local/private networks.
        async with httpx.AsyncClient(timeout=30, trust_env=False) as client:
            for _ in range(5):
                await self._check_url(url)
                async with client.stream("GET", url) as response:
                    if response.is_redirect:
                        url = urljoin(url, response.headers["location"])
                        continue
                    if response.status_code != 200:
                        raise ValueError("Le CV n’est pas accessible depuis son lien.")
                    content = bytearray()
                    async for chunk in response.aiter_bytes():
                        content.extend(chunk)
                        if len(content) > self.MAX_BYTES:
                            raise ValueError("Le CV dépasse la limite de 10 Mo.")
                    if not content.startswith(b"%PDF-"):
                        raise ValueError("Le CV doit être un document PDF.")
                    return await asyncio.to_thread(self._extract_text, bytes(content))
            raise ValueError("Le lien du CV comporte trop de redirections.")

    async def _check_url(self, url: str):
        parsed = urlparse(url)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            raise ValueError("Le CV doit utiliser un lien HTTPS accessible.")
        addresses = await asyncio.get_running_loop().getaddrinfo(
            parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM,
        )
        if not addresses or any(not ipaddress.ip_address(address[4][0]).is_global for address in addresses):
            raise ValueError("Le lien du CV ne peut pas cibler un réseau privé.")

    def _extract_text(self, content: bytes):
        reader = PdfReader(io.BytesIO(content))
        if reader.is_encrypted:
            raise ValueError("Le CV est protégé par un mot de passe.")
        if len(reader.pages) > 30:
            raise ValueError("Le CV dépasse la limite de 30 pages.")
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if not text.strip():
            raise ValueError("Le CV ne contient pas de texte lisible ; les PDF scannés nécessitent une vérification.")
        return text
