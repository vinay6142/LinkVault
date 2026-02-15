# LinkVault - Secure File & Text Sharing Platform

A modern web app for securely sharing files and text with friends or colleagues. Generate unique share links with optional password protection, auto-expiry, one-time viewing, and view counting.

## Features

- Upload files (up to 50MB) or just text snippets
- Secure, hard-to-guess share links (unique per upload)
- Optional password protection with bcrypt hashing
- Auto-expiring links (1 minute to 24 hours, default 10 min)
- One-time view mode (auto-deletes after first view)
- View count tracking with optional limits
- Personal dashboard for authenticated users
- Dark mode support

## Quick Start

### Prerequisites

- Node.js v18+ and npm
- MongoDB (Atlas cloud or local)
- Supabase account (free tier works)

### Setup

**1. Get Supabase credentials:**
- Create a project at [app.supabase.com](https://app.supabase.com)
- Create a storage bucket named `files` (make it public)
- Copy Project URL and Anon Key

**2. Backend setup:**

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/linkvault
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
FRONTEND_URL=http://localhost:5173
```

```bash
npm start  # runs on http://localhost:5000
```

**3. Frontend setup:**

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev  # runs on http://localhost:5173
```

Test by uploading a file at `http://localhost:5173`

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Axios
- **Backend:** Node.js, Express.js, Mongoose, bcryptjs
- **Storage:** Supabase (files) + MongoDB (metadata)
- **Auth:** Supabase Auth

## How It Works

1. **Upload:** User submits file/text with optional password, expiry, and view limits
2. **Generate:** Backend creates unique 12-char share ID and stores metadata in MongoDB
3. **Files:** Large files go to Supabase Storage, text stays in database
4. **Share:** User gets a link like `https://linkvault.app/share/abc123def456`
5. **Access:** Recipient opens link, sees file preview, can view if password matches
6. **Expiry:** Links auto-delete based on time or view count; manual deletion available too

## API Basics

**Upload:** `POST /api/shares/upload` - Send file/text with options
**View:** `POST /api/shares/view/:shareId` - Access content (requires password if protected)
**Info:** `GET /api/shares/info/:shareId` - Get metadata without content
**Delete:** `DELETE /api/shares/delete/:shareId` - Delete your own shares (auth required)
**List:** `GET /api/shares/user-shares` - Get all your shares (auth required)

Full API docs available in code comments.

---

## Key Design Choices

- **Dual Storage:** Files in Supabase (scalable), metadata in MongoDB (fast queries)
- **Unique IDs:** 12-char UUIDs prevent URL guessing and brute force
- **Atomic View Counts:** MongoDB's `$inc` operator prevents race conditions
- **Auto-Cleanup:** TTL index + backend job ensures files don't orphan
- **Optional Auth:** Anonymous uploads work; authentication required for deletion only
- **Password Hashing:** bcryptjs with 10 rounds (~100ms per check, industry standard)

## Production Deployment

### Docker

```bash
docker-compose up -d
```

### Manual Linux/Server

```bash
# Backend (use PM2 for process management)
cd backend
pm2 start server.js --name "linkvault-backend"

# Frontend (build and serve with Nginx)
cd frontend
npm run build
# Copy dist/ to Nginx root
```

**Production .env:**
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
# ... add Supabase and MongoDB credentials
```

## Troubleshooting

**Backend won't start?**
- Check MongoDB connection: `mongo mongodb://localhost:27017/linkvault`
- Verify all `.env` variables are set
- Check port 5000 isn't in use: `lsof -i :5000`

**Files not uploading?**
- Verify Supabase bucket `files` exists and is public
- Check `SUPABASE_SERVICE_KEY` is correct
- Ensure file size < 50MB

**Frontend can't reach backend?**
- Confirm `VITE_API_URL` points to correct backend
- Test: `curl http://localhost:5000/api/health`
- Check CORS config in backend

## Limitations

- **File size:** Max 50MB (configurable in multer)
- **Storage:** Files loaded into memory during upload (stream upload not implemented)
- **Supabase free tier:** 1GB storage limit
- **Rate limiting:** Not implemented (add if needed for production)
- **Encryption:** Files stored unencrypted in Supabase
- **Signed URLs:** Expire in 1 hour (regenerated on access)
- **Scalability:** Single MongoDB becomes bottleneck > 1M shares

## What's Not Here (Yet)

- Email notifications
- QR codes for sharing
- Download analytics
- Rate limiting
- Antivirus scanning
- GDPR data export/deletion
