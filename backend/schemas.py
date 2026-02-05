from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    name: str = Field(..., max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserOut(BaseModel):
    id: str
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
    signup_token: str
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=6)


class ResendOTPRequest(BaseModel):
    signup_token: str
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    reset_token: str
    email: EmailStr
    new_password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class ResendForgotOTPRequest(BaseModel):
    reset_token: str
    email: EmailStr


class VerifyForgotOTPRequest(BaseModel):
    reset_token: str
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=6)


class ResumeAnalysisRequest(BaseModel):
    resume_text: str


class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str


class MatchScoreResponse(BaseModel):
    score: float
    recommendation: Optional[str] = None

