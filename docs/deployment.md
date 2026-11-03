# ThreatForge — Production Deployment Guide

This document provides complete instructions for deploying ThreatForge to production environments using **Render** (Backend API & PostgreSQL Database) and **Vercel** (Frontend SPA).

---

## 1. Architecture & Persistence Strategy

In local development, ThreatForge uses a local SQLite database (`threatforge.db`). However, modern serverless and containerized cloud platforms (such as Render free tiers or Heroku) use ephemeral filesystems, meaning SQLite databases are wiped on redeployment or container restart.

For persistent production storage, ThreatForge's SQLAlchemy database engine automatically supports **PostgreSQL**. Simply set `DATABASE_URL` to a valid PostgreSQL connection string:
```
DATABASE_URL=postgresql://user:password@host:5432/threatforge
```

---

## 2. Backend Deployment (Render)

### Step 1: Provision a Managed PostgreSQL Instance (Recommended)
1. Sign in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** $\to$ **PostgreSQL**.
3. Name: `threatforge-db`
4. Plan: Free or Starter.
5. Once provisioned, copy the **Internal Database URL** (if deploying backend on Render) or **External Database URL**.

### Step 2: Deploy FastAPI Web Service
1. In Render, click **New +** $\to$ **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Name**: `threatforge-api`
   - **Region**: Closest to your users (e.g. Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `ENVIRONMENT` | `production` | Enables production error handling |
   | `DATABASE_URL` | `postgresql://...` | Connection string to your PostgreSQL instance |
   | `CORS_ORIGINS` | `https://your-threatforge-frontend.vercel.app` | Comma-separated list of allowed frontend domains |
   | `MAX_UPLOAD_SIZE_MB` | `10` | Maximum log upload size limit |
5. Click **Create Web Service**.
6. When deployment finishes, copy your backend URL (e.g., `https://threatforge-api.onrender.com`).

---

## 3. Frontend Deployment (Vercel)

### Step 1: Configure Project on Vercel
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New...** $\to$ **Project**.
3. Import your Git repository.
4. Set the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Configure Environment Variables:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://threatforge-api.onrender.com/api` | Full URL to the deployed backend API |
6. Click **Deploy**.

### Step 2: Single-Page Application (SPA) Routing
ThreatForge includes `frontend/vercel.json` to ensure client-side routing works properly on page refresh:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 4. CORS & Domain Linking

Ensure that the backend's `CORS_ORIGINS` environment variable exactly matches your Vercel deployment URL (without trailing slashes):
```
CORS_ORIGINS=https://threatforge-app.vercel.app,http://localhost:5173
```
If you configure a custom domain on Vercel (e.g. `https://threatforge.yourdomain.com`), append it to the `CORS_ORIGINS` list on Render and trigger a redeployment.

---

## 5. Health Checks & Verification

After both services are deployed, verify system operations:

1. **Backend Health Check**:
   ```bash
   curl -s https://your-threatforge-api.onrender.com/api/health | jq .
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "environment": "production",
     "version": "1.0.0",
     "timestamp": "..."
   }
   ```

2. **Frontend Connectivity**:
   - Open your Vercel URL in a browser.
   - Look at the top navigation bar: the status pill should show a pulsating green indicator: **Backend API Live**.
   - Click **Load Demo Data**: within seconds, the toast notification will confirm loaded telemetry and the charts will populate with dynamic backend data.

---

## 6. Troubleshooting

| Issue | Likely Cause | Resolution |
| :--- | :--- | :--- |
| **CORS Error in Browser Console** | Backend `CORS_ORIGINS` does not contain the Vercel domain | Add your exact Vercel frontend URL (no trailing slash) to Render's `CORS_ORIGINS` env variable. |
| **404 Not Found on Route Refresh** | Missing SPA rewrite rule | Verify that `frontend/vercel.json` exists with the rewrite rule to `/index.html`. |
| **Database Resets on App Restart** | Using local SQLite on ephemeral cloud hosting | Provision a PostgreSQL instance and configure `DATABASE_URL=postgresql://...`. |
| **File Upload 413 / Request Entity Too Large** | Upload exceeds configured threshold | Adjust `MAX_UPLOAD_SIZE_MB` in backend environment variables. |
| **Render Cold Start Latency** | Free tier spin-down on inactivity | Free tier instances sleep after 15 minutes of inactivity; the initial request may take ~30 seconds to wake up. |

---

## 7. Redeployment Instructions

- **Backend Update**: Commit and push changes to `main`. Render automatically triggers a rolling deployment.
- **Frontend Update**: Commit and push changes to `main`. Vercel automatically builds and deploys preview and production branches.
