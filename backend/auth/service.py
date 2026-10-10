from datetime import datetime, timedelta, timezone
import os
from fastapi import Response

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import bcrypt
from .model import User

from jose import ExpiredSignatureError, jwt,JWTError
SECRET_KEY = os.getenv("JWT_SECRET") or "your-secure-secret-key"  # Use env vars in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class UserNotFoundError(Exception):
    """Raised when a user cannot be found."""


class InvalidPasswordError(Exception):
    """Raised when a password is invalid."""



class AuthService():
    def __init__(self,db:AsyncSession):
        self.db=db

    async def register(self,username,email,password):
        exists=await self.db.execute(select(User).where(User.email==email))
        existing_user=exists.scalars().first()
        if existing_user:
            raise Exception("User already exists")
        hashed_password=self._hash_password(password)
        new_user=User(username=username,email=email,password_hash=hashed_password)
        self.db.add(new_user)
        await self.db.commit()
        return new_user

    async def get_user_by_id(self,user_id:int) -> User:
        query=await self.db.execute(select(User).where(User.id==user_id))
        user=query.scalars().first()
        if not user:
            raise UserNotFoundError("User not found")
        return user
    async def login(self,email,password):
        # look up user by email, verify password, and return a token if valid
        query=await self.db.execute(select(User).where(User.email==email))
        user=query.scalars().first()
        if not user:
            raise UserNotFoundError("User not found")
        # checkpw uses the salt in the stored hash; hashing again would not match.
        if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
            raise InvalidPasswordError("Invalid password")

        token=self.create_token(user)
        return token

    def set_auth_cookie(self, response: Response, token: str) -> None:
        # HttpOnly keeps the JWT out of JavaScript; the browser sends it automatically.
        # Cross-site HTTPS deployment needs SameSite=None together with Secure.
        secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=secure,
            samesite="none" if secure else "lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
        )
        response.headers["Cache-Control"] = "no-store"


    def _hash_password(self,password:str):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def create_token(self, user: User):
        payload = {
            "sub": user.email,
            "id": user.id,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    def verify_token(self, token: str):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

            user_id = payload.get("id")
            if user_id is None:
                raise ValueError("Token does not contain user id")

            return user_id

        except ExpiredSignatureError:
            raise ValueError("Token expired")
        except JWTError:
            raise ValueError("Invalid token")
    def clear_auth_cookie(self, response: Response) -> None:
        secure = os.getenv("COOKIE_SECURE", "false").lower() == "true"
        response.delete_cookie(
            key="access_token",
            path="/",
            httponly=True,
            secure=secure,
            samesite="none" if secure else "lax",
        )
        response.headers["Cache-Control"] = "no-store"
