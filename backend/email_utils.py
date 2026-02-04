import asyncio
from datetime import datetime, timedelta
from random import randint

import aiosmtplib
from email.message import EmailMessage
from sqlalchemy.orm import Session

from .config import settings
from .models import EmailOTP, User


def generate_otp() -> str:
    return f"{randint(100000, 999999)}"


async def send_otp_email(recipient_email: str, user_name: str, otp_code: str) -> None:
    message = EmailMessage()
    message["From"] = settings.EMAIL_USER
    message["To"] = recipient_email
    message["Subject"] = "SmartHire AI - Email Verification Code"

    body = (
        f"Dear {user_name},\n\n"
        f"Your SmartHire AI email verification code is {otp_code}.\n\n"
        "This code is valid for 5 minutes. If you did not request this verification, please ignore this email.\n\n"
        "— SmartHire AI"
    )
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=settings.EMAIL_HOST,
        port=settings.EMAIL_PORT,
        start_tls=True,
        username=settings.EMAIL_USER,
        password=settings.EMAIL_PASS,
    )


def create_and_store_otp(db: Session, user: User) -> EmailOTP:
    # Invalidate previous unused OTPs
    for otp in user.otps:
        if not otp.is_used:
            otp.is_used = True

    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
    email_otp = EmailOTP(
        user_id=user.id,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False,
    )
    db.add(email_otp)
    db.commit()
    db.refresh(email_otp)
    return email_otp


def verify_otp_code(db: Session, user: User, otp_code: str) -> bool:
    now = datetime.utcnow()
    otp_entry = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.user_id == user.id,
            EmailOTP.otp_code == otp_code,
            EmailOTP.is_used.is_(False),
            EmailOTP.expires_at > now,
        )
        .order_by(EmailOTP.expires_at.desc())
        .first()
    )
    if not otp_entry:
        return False

    otp_entry.is_used = True
    user.is_email_verified = True
    db.commit()
    return True

