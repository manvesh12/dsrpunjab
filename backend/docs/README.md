# Smart DSR Modern Stack

Organized final webstack. The repository root intentionally contains only two application folders: `frontend` and `backend`.

## Structure

- `frontend` - Next.js web app
- `frontend/public/legacy` - current working portal
- `frontend/scripts/maintenance` - frontend maintenance scripts for legacy UI assets
- `backend` - Express API backend, Prisma schema, worker, deployment notes and operations scripts
- `backend/docs` - deployment and migration notes
- `backend/scripts/windows` - Windows start/stop/helper scripts

## Run

```powershell
cd backend
npm install
npm run dev
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```
