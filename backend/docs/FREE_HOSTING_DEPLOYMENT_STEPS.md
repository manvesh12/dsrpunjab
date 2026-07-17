# Free Hosting Deployment Steps

This project can be deployed for a no-card demo using:

- Frontend: Vercel
- Backend API: Render
- PostgreSQL: Neon
- Redis queue/cache: Upstash
- File storage: temporary local storage on Render for demo only, or S3-compatible storage if available

This is a demo/free-hosting setup, not a permanent government production setup. Render free services may sleep, free databases have limits, and local file storage is not durable.

## 1. Repository Path

The application is now organized directly at the repository root:

```text
backend    Express + Prisma API
frontend    Next.js frontend
```

## 2. Neon PostgreSQL

Create a Neon project and copy the pooled PostgreSQL connection string.

Use it as:

```text
DATABASE_URL=postgresql://...
```

For Prisma on Render, keep SSL enabled in the Neon connection string.

## 3. Upstash Redis

Create an Upstash Redis database and copy the Redis URL.

Use it as:

```text
QUEUE_REDIS_URL=rediss://...
REDIS_URL=rediss://...
```

`QUEUE_REDIS_URL` is the important one for this API.

## 4. Render Backend API

Create a new Render Web Service.

Recommended settings:

```text
Repository: manvesh12/punjab_dsr
Root Directory: backend
Runtime: Node
Build Command: npm install --legacy-peer-deps && npm run build
Start Command: npm run start
```

Add environment variables:

```text
NODE_ENV=production
PORT=8080
DATABASE_URL=<Neon PostgreSQL URL>
QUEUE_REDIS_URL=<Upstash Redis URL>
REDIS_URL=<Upstash Redis URL>
JWT_SECRET=<long random secret>
JWT_REFRESH_SECRET=<different long random secret>
JWT_EXPIRES_IN=15m
SESSION_COOKIE_NAME=dsr_session
WEB_ORIGIN=<Vercel frontend URL after Vercel deploy>
PUBLIC_APP_URL=<Vercel frontend URL>/legacy
BREVO_API_KEY=<Brevo key, only if email OTP/invitation is needed>
SMTP_USER=<verified sender email, only if email is enabled>
LOCAL_FILE_STORAGE=true
```

For a free demo, `LOCAL_FILE_STORAGE=true` avoids requiring paid object storage. Uploaded/generated files may disappear if the Render instance restarts or redeploys. For durable storage later, set `LOCAL_FILE_STORAGE=false` and configure S3-compatible storage.

After first backend deploy, open:

```text
https://<render-service>.onrender.com/api/health
```

If the app has no `/api/health` route, use any known API route or Render logs to confirm startup.

## 5. Vercel Frontend

Create a new Vercel project from the same GitHub repository.

Recommended settings:

```text
Framework Preset: Next.js
Root Directory: frontend
Install Command: npm install --legacy-peer-deps
Build Command: npm run build
Output Directory: .next
```

Add environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://<render-service>.onrender.com
```

After Vercel gives a production URL, go back to Render and update:

```text
WEB_ORIGIN=https://<vercel-project>.vercel.app
PUBLIC_APP_URL=https://<vercel-project>.vercel.app/legacy
```

Then redeploy Render.

## 6. First Database Setup

The API start command currently runs:

```text
npx prisma db push --accept-data-loss && npm run seed && node dist/src/server.js
```

This creates/updates Neon schema and seeds initial data on startup.

For demo hosting this is acceptable. For serious production later, change it to a safer migration command and do not seed on every startup.

## 7. Free Demo Limitations

This setup is free/no-card friendly, but has limits:

- Render free service can sleep.
- Render local file storage is not permanent.
- Neon free database has storage/compute limits.
- Upstash free Redis has request/data limits.
- Custom domain may require paid domain purchase.
- This is suitable for demo, testing and approval, not final government production.

## 8. If Project Is Cancelled

Delete these resources:

1. Vercel project
2. Render web service
3. Neon database/project
4. Upstash Redis database
5. Any email/API keys created only for this project

Because no card is attached, there should be no continuing infrastructure bill.
