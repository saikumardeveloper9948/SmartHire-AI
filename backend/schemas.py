from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_email_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=6)


class ResendOTPRequest(BaseModel):
    email: EmailStr


class ResumeAnalysisRequest(BaseModel):
    resume_text: str


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str


class MatchScoreResponse(BaseModel):
    score: float
    recommendation: Optional[str] = None

