#!/usr/bin/env python
"""Script to test database connection"""
from backend.database import SessionLocal
from backend.models import User

if __name__ == "__main__":
    try:
        db = SessionLocal()
        users = db.query(User).all()
        print(f"✓ Database connection successful!")
        print(f"✓ Total users in database: {len(users)}")
        db.close()
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
