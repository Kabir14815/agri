# Deploy: Render (backend) + Netlify (frontend) + MongoDB Atlas

## 1. MongoDB Atlas

1. Open [MongoDB Atlas](https://cloud.mongodb.com/) → your cluster **cluster0**.
2. **Database Access**: user `Task` with password (store securely).
3. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) so Render can connect. For production you can restrict to Render IPs later.
4. Connection string (replace password if needed):

```
mongodb+srv://Task:YOUR_PASSWORD@cluster0.lnxh7gs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

Database name used by the app: **`kgf_farming`**

---

## 2. Render (backend API)

### Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint** → connect repo `Kabir14815/agri`.
3. Set **MONGODB_URI** when prompted (paste full connection string with password).
4. Deploy. Note your service URL, e.g. `https://kgf-farming-api.onrender.com`.

### Option B — Manual Web Service

| Setting | Value |
|--------|--------|
| Root Directory | `backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |

**Environment variables:**

| Key | Value |
|-----|--------|
| `MONGODB_URI` | Your Atlas connection string |
| `MONGODB_DB_NAME` | `kgf_farming` |
| `AUTH_SECRET` | Long random string (`openssl rand -hex 32`) |
| `ADMIN_EMAIL` | Production admin email |
| `ADMIN_PASSWORD` | Strong admin password (min 12 chars) |
| `CORS_ORIGINS` | `https://agriit.netlify.app,http://localhost:5173` |
| `PYTHON_VERSION` | `3.12.8` (**required** — avoids Python 3.14 build failures with pydantic) |

**Root Directory** must be `backend`.

Test: `https://YOUR-SERVICE.onrender.com/api/health` → `{"status":"ok","database":"mongodb",...}`

### Start failed (exit status 127 / gunicorn not found)

Your **Start Command** is wrong. In Render → **Settings** → change it to:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Or use the script from the repo (with Root Directory = `backend`):

```
bash start.sh
```

Then **Manual Deploy** again.

### Build failed (pydantic-core / metadata generation)

Render defaulted to Python 3.14. Fix: add env var **`PYTHON_VERSION`** = `3.12.8`, then **Manual Deploy** → Clear build cache & deploy.

---

## 3. Netlify (frontend)

1. Site already linked to GitHub → **Site settings** → **Environment variables**.
2. Add:

| Variable | Value |
|----------|--------|
| `VITE_API_URL` | `https://kgf-farming-api.onrender.com/api` (your Render URL + `/api`) |

3. **Deploy** (or trigger rebuild). The value in `netlify.toml` is a default; override in the UI if your Render URL differs.

4. Open `https://agriit.netlify.app` — login/register and dashboard call the Render API.

---

## 4. Local development

**Backend** (`backend/.env` — copy from `.env.example`):

```env
MONGODB_URI=mongodb+srv://Task:...@cluster0.lnxh7gs.mongodb.net/...
MONGODB_DB_NAME=kgf_farming
CORS_ORIGINS=http://localhost:5173
```

```bash
cd backend
pip install -r requirements.txt
python run.py
```

**Frontend** (uses Vite proxy to `localhost:8000` when `VITE_API_URL` is unset):

```bash
cd frontend
npm run dev
```

---

## Production admin (required)

Set on Render **before** the first deploy after this update:

| Variable | Example |
|----------|---------|
| `AUTH_SECRET` | output of `openssl rand -hex 32` |
| `ADMIN_EMAIL` | your admin email |
| `ADMIN_PASSWORD` | strong password (12+ chars) |

Legacy demo accounts (`demo@kgffarming.com`, `admin@kgffarming.com`, etc.) are **removed automatically** on API startup. The admin account is created from your env vars.

Sign in at `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
