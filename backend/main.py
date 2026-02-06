import sys
from pathlib import Path

# Add parent directory to path to enable backend module imports when running from backend directory
sys.path.insert(0, str(Path(__file__).parent.parent))

import uuid
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import ai_engine
import models
import schemas
from config import settings
from database import Base, engine, get_db
from email_utils import generate_otp, send_otp_email, send_forgot_password_otp
from security import (
    create_access_token,
    get_password_hash,
    verify_password,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartHire AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # For development, restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for pending signups (keyed by token, no cookies needed)
_pending_signups: dict[str, dict] = {}
_pending_password_resets: dict[str, dict] = {}


def _cleanup_expired_signups():
    """Remove expired entries from pending signups."""
    now = datetime.utcnow()
    expired = [k for k, v in _pending_signups.items() if datetime.fromisoformat(v["expires_at"]) < now]
    for k in expired:
        del _pending_signups[k]


def _cleanup_expired_resets():
    """Remove expired entries from pending password resets."""
    now = datetime.utcnow()
    expired = [k for k, v in _pending_password_resets.items() if datetime.fromisoformat(v["expires_at"]) < now]
    for k in expired:
        del _pending_password_resets[k]


@app.post("/auth/signup", status_code=status.HTTP_201_CREATED)
async def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Ensure email is not already registered
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    _cleanup_expired_signups()

    signup_token = str(uuid.uuid4())
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    _pending_signups[signup_token] = {
        "name": user_in.name,
        "email": user_in.email,
        "password_hash": get_password_hash(user_in.password),
        "otp": otp_code,
        "expires_at": expires_at.isoformat(),
    }

    await send_otp_email(user_in.email, user_in.name, otp_code)

    return {
        "message": "OTP sent to your email. Please verify to complete signup.",
        "signup_token": signup_token,
        "expires_at": expires_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    }


@app.post("/auth/verify-otp")
def verify_otp(payload: schemas.OTPVerifyRequest, db: Session = Depends(get_db)):
    pending = _pending_signups.get(payload.signup_token)
    if not pending or pending.get("email") != str(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This OTP has expired. Please complete signup again and request a new OTP.",
        )

    try:
        expires_at = datetime.fromisoformat(pending["expires_at"])
    except (KeyError, ValueError):
        _pending_signups.pop(payload.signup_token, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session. Please restart the signup process.",
        )

    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This OTP has expired. Please use the Resend OTP button to receive a new verification code.",
        )

    if pending.get("otp") != payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP.",
        )

    user = models.User(
        name=pending["name"],
        email=pending["email"],
        password_hash=pending["password_hash"],
        is_email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _pending_signups.pop(payload.signup_token, None)

    return {"message": "OTP verified successfully. Signup completed."}


@app.post("/auth/resend-otp")
async def resend_otp(payload: schemas.ResendOTPRequest):
    pending = _pending_signups.get(payload.signup_token)
    if not pending or pending.get("email") != str(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session expired. Please complete signup again from the beginning.",
        )

    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    pending["otp"] = otp_code
    pending["expires_at"] = expires_at.isoformat()

    await send_otp_email(pending["email"], pending["name"], otp_code)
    return {
        "message": "OTP resent.",
        "expires_at": expires_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    }


@app.post("/auth/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    _cleanup_expired_resets()

    reset_token = str(uuid.uuid4())
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    _pending_password_resets[reset_token] = {
        "email": user.email,
        "name": user.name,
        "otp": otp_code,
        "expires_at": expires_at.isoformat(),
        "verified": False,
    }

    await send_forgot_password_otp(user.email, user.name, otp_code)

    return {
        "message": "OTP sent to your email.",
        "reset_token": reset_token,
        "expires_at": expires_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    }


@app.post("/auth/resend-forgot-otp")
async def resend_forgot_otp(payload: schemas.ResendForgotOTPRequest):
    pending = _pending_password_resets.get(payload.reset_token)
    if not pending or pending.get("email") != str(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session expired. Please start the process again.",
        )

    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    pending["otp"] = otp_code
    pending["expires_at"] = expires_at.isoformat()

    await send_forgot_password_otp(pending["email"], pending["name"], otp_code)
    return {
        "message": "OTP resent.",
        "expires_at": expires_at.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
    }


@app.post("/auth/verify-forgot-otp", status_code=status.HTTP_200_OK)
def verify_forgot_otp(payload: schemas.VerifyForgotOTPRequest):
    pending = _pending_password_resets.get(payload.reset_token)
    if not pending or pending.get("email") != str(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session expired. Please start the process again.",
        )

    try:
        expires_at = datetime.fromisoformat(pending["expires_at"])
    except (KeyError, ValueError):
        _pending_password_resets.pop(payload.reset_token, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session. Please start the process again.",
        )

    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    if pending.get("otp") != payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP.",
        )

    pending["verified"] = True
    return {"message": "OTP verified successfully."}


@app.post("/auth/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    pending = _pending_password_resets.get(payload.reset_token)
    if not pending or pending.get("email") != str(payload.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session expired. Please start the process again.",
        )

    try:
        expires_at = datetime.fromisoformat(pending["expires_at"])
    except (KeyError, ValueError):
        _pending_password_resets.pop(payload.reset_token, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session. Please start the process again.",
        )

    if datetime.utcnow() > expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one.",
        )

    if not pending.get("verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP verification required before resetting password.",
        )

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    _pending_password_resets.pop(payload.reset_token, None)

    return {"message": "Password updated successfully."}


@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    # Distinguish between "not registered" and "invalid password"
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not registered. Please sign up before logging in.",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The password you entered is incorrect.",
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify OTP.",
        )

    token = create_access_token(str(user.id))
    return schemas.Token(access_token=token)


@app.post("/ai/analyze-resume")
def analyze_resume(payload: schemas.ResumeAnalysisRequest):
    cleaned = ai_engine.analyze_resume(payload.resume_text)
    return {"cleaned_text": cleaned}


@app.post("/ai/match-job", response_model=schemas.MatchScoreResponse)
def match_job(payload: schemas.JobMatchRequest):
    score, recommendation, missing, matched = ai_engine.compute_match_score(
        payload.resume_text, payload.job_description
    )
    return schemas.MatchScoreResponse(
        score=score,
        recommendation=recommendation,
        missing_keywords=missing,
        matched_keywords=matched,
        resume_text=payload.resume_text,
    )


def _extract_text_from_upload(upload: UploadFile, data: bytes) -> str:
    import io

    from PyPDF2 import PdfReader
    import docx

    filename = (upload.filename or "").lower()
    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(data))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    elif filename.endswith(".docx"):
        document = docx.Document(io.BytesIO(data))
        return "\n".join(p.text for p in document.paragraphs)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a PDF or DOCX file.",
        )


@app.post("/ai/match-job-file", response_model=schemas.MatchScoreResponse)
async def match_job_file(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    data = await file.read()
    resume_text = _extract_text_from_upload(file, data)
    score, recommendation, missing, matched = ai_engine.compute_match_score(
        resume_text, job_description
    )
    return schemas.MatchScoreResponse(
        score=score,
        recommendation=recommendation,
        missing_keywords=missing,
        matched_keywords=matched,
        resume_text=resume_text,
    )


@app.post("/ai/interview-questions")
def interview_questions(payload: schemas.InterviewQuestionsRequest):
    """Generate interview questions via OpenAI based on resume and job description."""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Starting interview questions generation")
        logger.info(f"Resume length: {len(payload.resume_text)}, Job desc length: {len(payload.job_description)}")
        
        result = ai_engine.generate_interview_questions(
            payload.resume_text,
            payload.job_description,
            payload.experience_level.value if payload.experience_level else None,
            payload.questions_per_category,
        )
        
        logger.info(f"Successfully generated interview questions")
        logger.info(f"Result: {result}")
        
        return result
    except ValueError as e:
        logger.error(f"ValueError in interview questions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        import traceback
        error_msg = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        logger.error(f"Error in interview questions: {error_msg}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error: {type(e).__name__}: {str(e)}")

