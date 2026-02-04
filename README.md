## SmartHire AI – Secure Email-Verified AI Recruitment Platform

SmartHire AI is a full-stack, AI-powered recruitment platform that combines **secure email
OTP-based authentication** with **intelligent resume screening and job matching**.

The system ensures users register using valid personal email IDs, offers a **responsive UI with
dark/light mode**, and integrates **NLP-based AI** for resume analysis — all built with
deployment compatibility in mind.

---

## Core Features

- **Email OTP verification (mandatory)**: Time-bound, one-time passwords sent to the user's email.
- **Secure login & signup** with password hashing and JWT-based sessions.
- **AI-based resume analysis & job matching** using TF-IDF and cosine similarity.
- **Match score & recommendation generation** for candidate–job fit.
- **Dark / Light mode** using React Context API and `localStorage`.
- **Success & error alerts** with auto-dismiss behavior.
- **Fully responsive UI** using Tailwind CSS.
- **Deployment-ready architecture** with environment variables and cloud MySQL support.

---

## Tech Stack

- **Frontend**
  - React (Vite)
  - Tailwind CSS
  - Context API
  - Axios
  - React Router DOM

- **Backend**
  - Python
  - FastAPI
  - SQLAlchemy
  - JWT Authentication
  - SMTP (Email OTP)

- **Database**
  - MySQL

- **AI / NLP**
  - Python
  - Scikit-learn
  - TF-IDF Vectorizer
  - Cosine Similarity

- **Deployment**
  - Frontend: Vercel
  - Backend: Render / Railway
  - Database: Railway MySQL / PlanetScale

---

## System Architecture

React + Tailwind (Frontend)  
&nbsp;&nbsp;&nbsp;&nbsp;|  
&nbsp;&nbsp;&nbsp;&nbsp;Axios  
&nbsp;&nbsp;&nbsp;&nbsp;|  
FastAPI (Backend)  
&nbsp;&nbsp;&nbsp;&nbsp;|  
&nbsp;&nbsp;&nbsp;&nbsp;SQLAlchemy ORM  
&nbsp;&nbsp;&nbsp;&nbsp;|  
MySQL  
&nbsp;&nbsp;&nbsp;&nbsp;|  
AI Engine (NLP)  
&nbsp;&nbsp;&nbsp;&nbsp;|  
Email OTP (SMTP)

---

## Database Schema (MySQL)

Users:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255),
  is_email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Email OTP:

```sql
CREATE TABLE email_otp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  otp_code VARCHAR(6),
  expires_at DATETIME,
  is_used BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Authentication Flow

1. User signs up with name, email, and password.
2. System generates a 6-digit OTP.
3. OTP is sent to user’s email.
4. User verifies OTP.
5. Email is marked as verified.
6. Login allowed only after verification.

**OTP Email Template**

```text
Dear <User Name>,

Your SmartHire AI email verification code is 482193.

This code is valid for 5 minutes. If you did not request this verification, please ignore this email.

— SmartHire AI
```

---

## API Endpoints

- **Authentication**
  - `POST /auth/signup`
  - `POST /auth/verify-otp`
  - `POST /auth/resend-otp`
  - `POST /auth/login`

- **AI Module**
  - `POST /ai/analyze-resume`
  - `POST /ai/match-job`

---

## Dark / Light Mode

- **Implemented using** React Context API.
- Theme preference stored in `localStorage`.
- Tailwind `dark:` utility classes used across components.
- Global toggle placed in the header.

---

## Alerts System

- **Success alerts** → green.
- **Error alerts** → red.
- **Auto dismiss** after 3 seconds.

Example usage (frontend):

```jsx
<Alert type="success" message="OTP verified successfully" />
<Alert type="error" message="Invalid OTP" />
```

---

## Responsiveness Guidelines

- **Mobile-first** design.
- Tailwind breakpoints:
  - `sm`, `md`, `lg`
- Forms stack vertically on mobile.
- Buttons become full-width on small screens.

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=mysql+pymysql://username:password@host/db_name
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=app_password
JWT_SECRET=your_secret_key
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=https://your-backend-url
```

---

## Running the Project Locally

### Backend Setup

- **Step 1**: Create and activate virtual environment

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS / Linux
```

- **Step 2**: Install dependencies

```bash
pip install -r requirements.txt
```

- **Step 3**: Set environment variables

Create a `.env` file in `backend` based on the variables listed above.

- **Step 4**: Run FastAPI with Uvicorn

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Deployment Checklist

- **Backend**
  - Use `requirements.txt`.
  - Bind to the platform-provided **`$PORT`**.
  - Enable CORS (already configured in `backend/main.py`).
  - Use a **cloud MySQL** instance.
  - Use **SMTP App Password** for email sending.

- **Frontend**
  - No hardcoded API URLs (uses `VITE_API_BASE_URL`).
  - Run `npm run build` before deploying to Vercel.

---

## Resume Description (Copy-Paste Ready)

**SmartHire AI – Secure Email-Verified AI Recruitment Platform**

- Built a full-stack AI-powered recruitment platform using React (Vite), Tailwind CSS, FastAPI, and MySQL.
- Implemented email OTP-based authentication to ensure users register with valid personal email IDs.
- Integrated NLP-based resume analysis and job matching using TF-IDF and cosine similarity.
- Added dark/light mode, responsive UI, real-time alerts, and deployment-ready architecture.
