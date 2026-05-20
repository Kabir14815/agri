# Deploy in 15 minutes (beginner guide)

Follow these steps **in order**. Copy-paste the values below.

---

## Part 1 — MongoDB (one time, 2 minutes)

1. Open https://cloud.mongodb.com and log in.
2. Click **Network Access** (left menu) → **Add IP Address** → **Allow Access from Anywhere** → Confirm.
3. You are done with MongoDB for now.

---

## Part 2 — Render backend (API)

### If you already have a broken **agri** service on Render

1. Open https://dashboard.render.com
2. Click your service **agri**
3. Click **Settings** (left side)
4. Find **Build & Deploy** and set:

   | Field | What to type |
   |-------|----------------|
   | **Environment** | **Docker** (change from Python if needed) |
   | **Root Directory** | `backend` |
   | **Dockerfile Path** | `Dockerfile` |
   | **Start Command** | **leave empty** (delete `gunicorn...` if it is there) |

5. Click **Environment** (left side) and add these 3 variables:

   | Key | Value (copy exactly) |
   |-----|----------------------|
   | `MONGODB_URI` | `mongodb+srv://Task:1234@cluster0.lnxh7gs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` |
   | `MONGODB_DB_NAME` | `kgf_farming` |
   | `CORS_ORIGINS` | `https://agriit.netlify.app,http://localhost:5173` |

6. **Save** everything.
7. Click **Manual Deploy** → **Deploy latest commit**
8. Wait until status is **Live** (green). Copy your URL, e.g. `https://agri.onrender.com`

9. Test in browser: open `https://agri.onrender.com/api/health`  
   You should see: `"status":"ok"` and `"database":"mongodb"`

### If you prefer a fresh start (Blueprint)

1. https://dashboard.render.com → **New +** → **Blueprint**
2. Connect GitHub repo **Kabir14815/agri**
3. When asked for **MONGODB_URI**, paste:
   `mongodb+srv://Task:1234@cluster0.lnxh7gs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
4. Click **Apply** and wait until **Live**.

---

## Part 3 — Netlify frontend (website)

1. Open https://app.netlify.com → your site (**agriit**)
2. **Site configuration** → **Environment variables** → **Add a variable**
3. Add:

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | `https://agri.onrender.com/api` |

   Replace `agri` with **your** Render service name from Part 2.

4. Go to **Deploys** → **Trigger deploy** → **Deploy site**
5. Wait until done. Open https://agriit.netlify.app

---

## Part 4 — Test login

| Email | Password |
|-------|----------|
| demo@kgffarming.com | demo1234 |
| admin@kgffarming.com | admin1234 |

After login you should see **My Dashboard** with name, email, and amount.

---

## Something wrong?

| Problem | Fix |
|---------|-----|
| Build failed (pydantic) | Add env `PYTHON_VERSION` = `3.12.8` (only if using Python, not Docker) |
| `gunicorn not found` | Use **Docker** + empty Start Command (see Part 2) |
| Site loads but login fails | Check `VITE_API_URL` on Netlify matches your Render URL + `/api` |
| API health fails | Check MongoDB **Network Access** allows `0.0.0.0/0` |

Need help? Send a screenshot of the Render **Logs** tab after a failed deploy.
