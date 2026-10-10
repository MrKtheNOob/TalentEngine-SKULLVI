from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from sqlalchemy.ext.asyncio import AsyncSession
from shared.dependencies import get_db
from .service import AuthService, InvalidPasswordError, UserNotFoundError
from .schemas import UserOut, LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.get("/me", response_model=UserOut)
async def get_current_user(request: Request):
    # Middleware verifies the cookie and attaches the user before routing.
    if request.state.user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return request.state.user


@router.post("/login")
async def login(payload: LoginRequest, response: Response, service: AuthService = Depends(get_auth_service)):
    try:
        token= await service.login(payload.email, payload.password)
    except UserNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except InvalidPasswordError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

    service.set_auth_cookie(response, token)

    return {"message": "Login successful"}


@router.post("/logout")
async def logout(
    response: Response,
    service: AuthService = Depends(get_auth_service),
):
    service.clear_auth_cookie(response)
    return {"message": "Logged out"}
