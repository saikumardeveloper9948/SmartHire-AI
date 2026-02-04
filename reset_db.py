#!/usr/bin/env python
"""Script to reset database tables"""
import sys
from backend.database import Base, engine

if __name__ == "__main__":
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database reset successfully!")
