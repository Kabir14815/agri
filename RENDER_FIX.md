# Fix Render "gunicorn: command not found" (exit 127)

Your logs show Render is still running:

```
gunicorn your_application.wsgi
```

That is **Render’s default placeholder**, not this project. You must change it.

---

## Option A — Fix Start Command (fastest)

1. Open [Render Dashboard](https://dashboard.render.com/) → service **agri**
2. Click **Settings** (left sidebar, not Environment)
3. Scroll to **Build & Deploy**
4. Set **Root Directory** to: `backend`
5. Set **Start Command** to exactly:

   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

6. **Delete** any line that says `gunicorn your_application.wsgi`
7. Click **Save Changes**
8. Go to **Manual Deploy** → **Deploy latest commit**

---

## Option B — Use Docker (if Option A keeps resetting)

1. **Settings** → **Build & Deploy**
2. Change **Language** / runtime to **Docker**
3. **Dockerfile Path**: `Dockerfile` (repo root)
4. **Root Directory**: leave **empty** (repo root)
5. Save → **Manual Deploy**

Dockerfile already runs: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Required environment variables

| Key | Example |
|-----|---------|
| `MONGODB_URI` | `mongodb+srv://Task:...@cluster0.lnxh7gs.mongodb.net/...` |
| `MONGODB_DB_NAME` | `kgf_farming` |
| `CORS_ORIGINS` | `https://agriit.netlify.app,http://localhost:5173` |
| `PYTHON_VERSION` | `3.12.8` (Python runtime only, not needed for Docker) |

---

## Success check

Open: `https://agri.onrender.com/api/health`

Expected: `{"status":"ok","database":"mongodb",...}`
