# KGF Farming - Website Clone

A React + FastAPI clone of [kgffarming.com](https://kgffarming.com/), built with a clean, modular structure and a green eco-farming theme.

> **Disclaimer:** This is an educational/demo clone. All trademarks belong to *Kamauput Growth Farming Pvt Ltd.*

## Tech Stack

- **Frontend:** React 18 (Vite), React Router v6, react-icons, plain CSS (custom design system)
- **Backend:** FastAPI, Pydantic v2, Uvicorn, **MongoDB Atlas** (PyMongo)
- **Deploy:** Render (API) + Netlify (frontend) — see [DEPLOY.md](./DEPLOY.md)

## Project Structure

```
MLM/
├─ backend/
│  ├─ app/
│  │  ├─ __init__.py
│  │  ├─ main.py        FastAPI app + routes
│  │  └─ data.py        In-memory data (products, services, FAQs, etc.)
│  ├─ requirements.txt
│  └─ run.py            python run.py to launch the API
└─ frontend/
   ├─ index.html
   ├─ package.json
   ├─ vite.config.js
   ├─ public/favicon.svg
   └─ src/
      ├─ main.jsx
      ├─ App.jsx
      ├─ api.js
      ├─ components/    Navbar, Footer, PageBanner, ScrollToTop
      ├─ sections/      Hero, FeatureStrip, AboutSection, ProductsSection, ...
      ├─ pages/         Home, About, Services, WhyUs, Achievers, Blog, Contact, Login, Register, ...
      └─ styles/global.css
```

## Features Implemented

### Frontend pages
- **Home** — hero, feature strip, about, products with category filter, Jaivik Khad, Earthworm, services, benefits, FAQ, testimonials, latest projects.
- **About / Our Legals**
- **Services**
- **Why Us**
- **Achievers** (top performers grid)
- **Blog** + Blog Detail
- **Contact** (form posts to FastAPI)
- **Login / Register / Franchisee Login** (form posts to FastAPI; stores token in `localStorage`)

### Backend endpoints (all under `/api`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | health check |
| GET | `/company` | company info |
| GET | `/products?category=...` | list products (optional category filter) |
| GET | `/products/{id}` | single product |
| GET | `/categories` | product categories |
| GET | `/services` | services list |
| GET | `/faqs` | FAQ items |
| GET | `/testimonials` | testimonials |
| GET | `/projects` | latest projects |
| GET | `/achievers` | achievers grid |
| GET | `/blog` | blog posts |
| GET | `/blog/{id}` | single blog post |
| POST | `/contact` | submit contact form |
| POST | `/auth/register` | register user |
| POST | `/auth/login` | login user |

API docs are auto-generated at `http://localhost:8000/docs`.

## Getting Started

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python run.py
```

The API will be available at `http://localhost:8000` (docs at `/docs`).

### 2. Frontend (React + Vite)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The site opens at `http://localhost:5173`. Vite is configured to **proxy** `/api/*` to `http://localhost:8000`, so the frontend talks to FastAPI seamlessly.

### Production build

```bash
cd frontend
npm run build
npm run preview
```

## Production setup

- Data is stored in **MongoDB Atlas** (`MONGODB_URI`). The product catalogue is seeded from `backend/app/data.py` on first run.
- Passwords are hashed with **PBKDF2**; session tokens are **HMAC-signed** (`AUTH_SECRET`).
- **No demo accounts** are seeded. Set these in `backend/.env` (or Render env vars):

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | Long random string for signed login tokens (`openssl rand -hex 32`) |
| `ADMIN_EMAIL` | Production admin login email |
| `ADMIN_PASSWORD` | Strong admin password (min 12 characters) |

On startup the API removes legacy demo users (`demo@`, `partner@`, `farmer@`, hardcoded admin) and creates/updates the admin from `ADMIN_EMAIL` + `ADMIN_PASSWORD`.

- Farmer accounts are assigned by an admin via **Admin → Users → role** (not public registration).
- Replace Unsplash/blog placeholder images with your own assets when deploying.
