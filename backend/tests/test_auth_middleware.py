from contextlib import asynccontextmanager
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import Request, Response

import config


def make_request(path, cookie=None, method="GET"):
    headers = [(b"cookie", f"access_token={cookie}".encode())] if cookie else []
    return Request({"type": "http", "method": method, "path": path, "headers": headers})


@pytest.mark.parametrize("path", ["/api/programs/", "/api/jobs/imports", "/api/auth/me"])
async def test_missing_cookie_blocks_protected_endpoints(path):
    next_handler = AsyncMock()
    response = await config.auth_middleware(make_request(path), next_handler)
    assert response.status_code == 401
    next_handler.assert_not_awaited()


@pytest.mark.parametrize("path,method", [
    ("/api/auth/login", "POST"),
    ("/api/auth/logout", "POST"),
    ("/api/programs/", "OPTIONS"),
])
async def test_public_endpoints_and_preflights_pass(path, method):
    next_handler = AsyncMock(return_value=Response(status_code=204))
    response = await config.auth_middleware(make_request(path, method=method), next_handler)
    assert response.status_code == 204
    next_handler.assert_awaited_once()


@pytest.mark.parametrize("valid", [True, False])
async def test_cookie_validation(monkeypatch, valid):
    user = SimpleNamespace(id=1)
    service = SimpleNamespace(
        verify_token=Mock(return_value=1, side_effect=None if valid else ValueError("expired")),
        get_user_by_id=AsyncMock(return_value=user),
    )
    session = object()

    @asynccontextmanager
    async def sessions():
        yield session

    monkeypatch.setattr(config, "AuthService", Mock(return_value=service))
    request = make_request("/api/programs/", cookie="test-token")
    request.scope["app"] = SimpleNamespace(state=SimpleNamespace(database=SimpleNamespace(sessions=sessions)))
    next_handler = AsyncMock(return_value=Response(status_code=200))
    response = await config.auth_middleware(request, next_handler)
    service.verify_token.assert_called_once_with("test-token")
    if valid:
        assert response.status_code == 200
        assert request.state.user is user
        next_handler.assert_awaited_once()
    else:
        assert response.status_code == 401
        next_handler.assert_not_awaited()
