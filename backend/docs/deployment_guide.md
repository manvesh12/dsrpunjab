# Zero Bill Production Deployment Guide

You have chosen the **Zero Bill Deployment Plan**. This setup is designed to have near-zero unexpected billing risks by strictly utilizing free tiers.

## Safety Rules for this Plan
- **NO credit card added** (if avoidable).
- **NO upgrades or auto-scaling** enabled.
- **NO paid add-ons or premium domains**.
- **If limits hit:** The website slows down or sleeps, data remains safe, and the bill stays at **$0**.

---

## 1. Database (Neon) - Free PostgreSQL
1. Go to [Neon.tech](https://neon.tech) and sign up.
2. Create a new Free project (single database, no scaling).
3. Copy the **Connection String** (`postgresql://...`).
4. This is your `DATABASE_URL`.

## 2. Redis (Upstash) - Free Tier
1. Go to [Upstash.com](https://upstash.com) and sign up.
2. Create a new **Redis Database** (Serverless, Free Plan).
3. Copy the Node.js `redis://` connection URL.
4. This is your `QUEUE_REDIS_URL`.

## 3. Storage (Local Uploads) - ₹0 Cost
We will avoid paid storage (like S3 or R2) for now. The backend is already configured to use **local storage** by default (`LOCAL_FILE_STORAGE` is implicitly true).
*Note: Render's free tier spins down on inactivity, and local files on free instances are wiped on restart. This is an accepted trade-off for a $0 bill.*

## 4. Backend API (Render) - Free Web Service
1. Go to [Render.com](https://render.com) and log in with GitHub.
2. Click **New** -> **Web Service**. Connect your `manvesh12/punjab_dsr` repository.
3. Select the **Free** instance type.
4. **Settings:**
   - Build Command: `npm install --legacy-peer-deps && npm run build`
   - Start Command: `npm run start`
   - Root Directory: `backend`
5. **Environment Variables:**
   - `NODE_ENV=production`
   - `DATABASE_URL=` *(paste Neon URL)*
   - `QUEUE_REDIS_URL=` *(paste Upstash URL)*
   - `JWT_SECRET=` *(generate a secure random string)*
   - `JWT_REFRESH_SECRET=` *(generate a secure random string)*
6. Copy the public Render URL (e.g., `https://dsr-api.onrender.com`). This is your `API_ORIGIN`.

## 5. Frontend (Vercel) - Free Plan
1. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New Project** and import `manvesh12/punjab_dsr`.
3. Set **Root Directory** to `frontend` and Framework to **Next.js**.
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_BASE_URL=` *(paste your Render API URL here)*
5. Click **Deploy**. Vercel will give you a public URL (e.g., `https://dsr-portal.vercel.app`).
6. **Final Step:** Go back to Render Environment Variables and add `WEB_ORIGIN=` *(paste your Vercel URL)* so CORS allows the connection.

> [!TIP]
> **Shutdown Anytime:** If you ever want to completely shut this down, simply delete the Vercel deployment, pause/delete the Render backend, and delete the Neon DB. Everything is safe and completely free.
