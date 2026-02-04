from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import ai_engine, models, schemas
from .config import settings
from .database import Base, engine, get_db
from .email_utils import create_and_store_otp, send_otp_email, verify_otp_code
from .security import (
    create_access_token,
    get_password_hash,
    verify_password,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartHire AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/signup", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
async def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = models.User(
        name=user_in.name,
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    otp = create_and_store_otp(db, user)
    # Fire and forget the email sending
    await send_otp_email(user.email, user.name, otp.otp_code)

    return user


@app.post("/auth/verify-otp")
def verify_otp(payload: schemas.OTPVerifyRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if verify_otp_code(db, user, payload.otp):
        return {"message": "OTP verified successfully"}

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired OTP",
    )


@app.post("/auth/resend-otp")
async def resend_otp(payload: schemas.ResendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    otp = create_and_store_otp(db, user)
    await send_otp_email(user.email, user.name, otp.otp_code)
    return {"message": "OTP resent successfully"}


@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
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
    score, recommendation = ai_engine.compute_match_score(
        payload.resume_text, payload.job_description
    )
    return schemas.MatchScoreResponse(score=score, recommendation=recommendation)

