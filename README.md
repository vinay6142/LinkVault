# LinkVault - Secure File & Text Sharing Platform

A modern, full-stack web application for securely sharing files and text with advanced access control features. Share content via unique links with optional password protection, one-time view limiting, custom expiry times, and built-in view tracking.

**Live Features:**
- 📤 Upload files (up to 50MB) or plain text
- 🔗 Unique, hard-to-guess share links
- 🔒 Optional password protection
- ⏰ Custom expiry times (1 minute - 24 hours, default: 10 minutes)
- 👁️ One-time view access (auto-delete after viewing)
- 📊 View count tracking with optional limits
- 👤 User authentication & personal dashboard
- 🗑️ Manual delete before expiry
- 🌙 Dark mode support

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture Overview](#architecture-overview)
3. [Setup Instructions](#setup-instructions)
4. [API Documentation](#api-documentation)
5. [Design Decisions](#design-decisions)
6. [Assumptions & Limitations](#assumptions--limitations)
7. [Deployment](#deployment)
8. [Additional Documentation](#additional-documentation)

---

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Next-generation build tool
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client with interceptors
- **Supabase JS SDK** - Authentication & real-time integration
- **React Router** - Client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web server framework
- **MongoDB** - NoSQL database for metadata
- **Mongoose** - ODM for MongoDB
- **Supabase** - File storage & user authentication
- **Multer** - Multipart file upload handling
- **bcryptjs** - Password hashing (10 salt rounds)
- **UUID** - Unique ID generation (12-char prefix)

### Infrastructure
- **Supabase Storage** - Scalable cloud file storage with signed URLs
- **MongoDB Atlas** - Cloud database with automatic backups
- **Docker** - Containerization (optional)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────┐
│         Frontend (React + Vite)                 │
│                                                 │
│  HomePage → UploadForm → SuccessModal           │
│  SharePage → FileDisplay/TextDisplay            │
│  DashboardPage → ShareList                      │
│  LoginPage/SignupPage → AuthContext             │
└─────────────────────────────────────────────────┘
         │
         │ REST API + JWT
         │
         ↓
┌─────────────────────────────────────────────────┐
│      Backend (Express.js)                       │
│                                                 │
│  Routes: /shares, /auth, /users                 │
│  Middleware: Auth, Multer, Error handling       │
│  Jobs: Cleanup (every 5 minutes)                │
└─────────────────────────────────────────────────┘
         │
         ├──────────────────────────┬──────────────────────────┐
         │                          │                          │
         ↓                          ↓                          ↓
    MongoDB              Supabase Storage      Supabase Auth
    (Metadata)           (File Bytes)          (User Management)
```

### Data Flow: Upload to Storage

```
User browses file/text
    ↓
UploadForm validates input
    ├─ File size < 50MB ✓
    ├─ Text or file, not both ✓
    └─ Password length ≥ 4 (if protected) ✓
    ↓
POST /api/shares/upload (FormData + JWT)
    ↓
Backend processes:
    ├─ Multer parses multipart data
    ├─ Auth middleware extracts userId
    ├─ Generate unique shareId (12-char)
    ├─ Hash password (bcryptjs)
    ├─ Calculate expiresAt timestamp
    │
    ├─ If FILE:
    │   ├─ Upload to Supabase Storage
    │   ├─ Path: {shareId}/{fileName}
    │   └─ Generate signed URL (1 hour validity)
    │
    └─ If TEXT:
        └─ Store directly in MongoDB
    ↓
Create MongoDB document:
    {
      shareId, userId, contentType,
      fileName, storagePath, fileUrl, fileSize,
      password (hashed), isPasswordProtected,
      isOneTimeView, viewCount, maxViewCount,
      createdAt, expiresAt
    }
    ↓
Return success response:
    {
      shareId: 'abc123def456',
      shareUrl: 'https://linkvault.app/share/abc123def456',
      expiresAt: '2026-02-15T10:15:00.000Z'
    }
    ↓
User shares link
```

### Data Flow: View & Download

```
User opens /share/{shareId}
    ↓
GET /api/shares/info/{shareId}
    ├─ Find share in MongoDB
    ├─ Check if expired
    └─ Return metadata (no content)
    ↓
Frontend shows preview:
    ├─ File: name, size, type, icon
    └─ Password prompt if protected
    ↓
User clicks "View" or "Download"
    ↓
POST /api/shares/view/{shareId}
    (with password in body if protected)
    ↓
Backend validates:
    ├─ Share exists
    ├─ Not expired (delete if expired)
    ├─ Password correct (if protected)
    ├─ Not already viewed (if one-time)
    ├─ View count < max (if limited)
    └─ Increment viewCount (atomic)
    ↓
Response:
    For TEXT:
    {
      contentType: 'text',
      content: 'The actual text',
      viewCount: 1
    }

    For FILE:
    {
      contentType: 'file',
      fileName: 'document.pdf',
      fileUrl: 'https://...signed-url...',
      fileSize: 1048576,
      fileMimeType: 'application/pdf',
      viewCount: 1
    }
    ↓
Frontend display:
    TEXT: Show in textarea, copy button
    FILE: Browser download via signed URL
    ↓
If one-time view:
    └─> Delete from storage + MongoDB
        (after 100ms response delay)
```

---

## Setup Instructions

### Prerequisites

- **Node.js** v18+ and npm/yarn
- **MongoDB** (Cloud: Atlas, Local: Community Edition)
- **Supabase** account (free tier available)
- **Git** for cloning

### 1. Supabase Configuration

#### Create Storage Bucket

1. Go to [Supabase Console](https://app.supabase.com)
2. Create new project or use existing one
3. Navigate to **Storage** → **Create Bucket**
   - Bucket name: `files`
   - Make it **Public** (for signed URLs)

See `SUPABASE_STORAGE_SETUP.md` for detailed instructions.

#### Get Credentials

In Supabase Dashboard:
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **Anon Key** → `VITE_SUPABASE_ANON_KEY`
- Copy **Service Key** → Backend `.env` (for server operations)

### 2. Backend Setup

```bash
# Clone and navigate
git clone <repo-url>
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/linkvault?retryWrites=true&w=majority

# Frontend URL (for CORS & links)
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

Start backend:

```bash
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env`:

```env
# API endpoint
VITE_API_URL=http://localhost:5000/api

# Supabase (same as backend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start frontend:

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### 4. Verify Setup

1. Open `http://localhost:5173` in browser
2. Upload a test file or text
3. Copy the share link and test access
4. Check backend logs for any errors

---

## API Documentation

### Authentication

All endpoints that require authentication accept a JWT token in the `Authorization` header:

```
Authorization: Bearer {JWT_TOKEN}
```

The JWT is obtained from **Supabase Auth** and stored in browser localStorage.

### Endpoints

#### Upload Share
**POST** `/api/shares/upload`

Requires: Authentication (optional)

Parameters (multipart/form-data):
- `text` (string, optional) - Text content to share
- `file` (file, optional) - File to upload (max 50MB)
- `password` (string, optional) - Password protection
- `isOneTimeView` (boolean, optional) - Delete after first view
- `expiryMinutes` (number, optional) - Expiry in minutes (1-1440)
- `expiryDateTime` (ISO string, optional) - Specific expiry time
- `maxViewCount` (number, optional) - Max views allowed

Constraints (validated):
- Either `text` or `file`, not both
- `password`: length ≥ 4 (if provided)
- `expiryMinutes`: 1-1440 (if provided)
- `expiryDateTime`: must be in future (if provided)
- `maxViewCount`: ≥ 1 (if provided)

Response (201 Created):
```json
{
  "success": true,
  "shareId": "abc123def456",
  "shareUrl": "https://linkvault.app/share/abc123def456",
  "expiresAt": "2026-02-15T10:15:00.000Z"
}
```

---

#### View Share Content
**POST** `/api/shares/view/:shareId`

Requires: Nothing (but may need password)

Request Body:
```json
{
  "password": "optional-password"
}
```

Response (200 OK) - For Text:
```json
{
  "success": true,
  "contentType": "text",
  "content": "Shared text content here",
  "viewCount": 1
}
```

Response (200 OK) - For File:
```json
{
  "success": true,
  "contentType": "file",
  "fileName": "document.pdf",
  "fileUrl": "https://project.supabase.co/storage/v1/object/sign/files/...",
  "fileSize": 1048576,
  "fileMimeType": "application/pdf",
  "viewCount": 1
}
```

Error Responses:
- `404` - Share not found or expired
- `403` - Password required / incorrect password / one-time link already viewed / max views reached
- `400` - Invalid request

---

#### Get Share Info
**GET** `/api/shares/info/:shareId`

Requires: Nothing

Response (200 OK):
```json
{
  "success": true,
  "shareId": "abc123def456",
  "userId": "user-uuid-or-null",
  "contentType": "file",
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "isPasswordProtected": false,
  "isOneTimeView": false,
  "viewCount": 1,
  "maxViewCount": null,
  "expiresAt": "2026-02-15T10:15:00.000Z"
}
```

---

#### Delete Share
**DELETE** `/api/shares/delete/:shareId`

Requires: Authentication (user must be owner)

Response (200 OK):
```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

Error Responses:
- `401` - Not authenticated
- `403` - Not share owner
- `404` - Share not found

---

#### List User's Shares
**GET** `/api/shares/user-shares`

Requires: Authentication

Response (200 OK):
```json
{
  "success": true,
  "shares": [
    {
      "shareId": "abc123def456",
      "contentType": "file",
      "fileName": "document.pdf",
      "fileSize": 1048576,
      "isPasswordProtected": false,
      "isOneTimeView": false,
      "viewCount": 3,
      "maxViewCount": null,
      "expiresAt": "2026-02-15T10:15:00.000Z",
      "createdAt": "2026-02-15T10:05:00.000Z"
    }
  ],
  "count": 1
}
```

---

#### Get Current User
**GET** `/api/auth/me`

Requires: Authentication

Response (200 OK):
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "display_name": "John Doe"
  }
}
```

---

#### Health Check
**GET** `/api/health`

Requires: Nothing

Response (200 OK):
```json
{
  "status": "Backend is running"
}
```

---

## Design Decisions

### 1. **Supabase Storage vs Database Storage**

**Decision:** Use Supabase Storage for files, MongoDB for metadata

**Rationale:**
- Files stored as cloud objects, not database records (better scalability)
- Signed URLs provide time-limited access without exposing storage paths
- Automatic CDN distribution for fast downloads globally
- Cost-effective (pay per GB vs database storage overhead)
- Easier to implement file deletions cleanly

**Trade-off:** More complex setup requiring two storage systems

---

### 2. **Dual Cleanup Mechanism**

**Decision:** Implement both MongoDB TTL index AND scheduled backend job

**Rationale:**
- **TTL Index:** Automatic document deletion every 60 seconds (no coding needed)
- **Backend Job:** Ensures Supabase Storage files are deleted before DB documents
- **Reactive Cleanup:** On-access validation catches expired content immediately

**Benefits:** Robust cleanup with no orphaned files

---

### 3. **Share ID Generation**

**Decision:** 12-character UUID prefix (alphanumeric)

**Rationale:**
- UUID provides mathematical uniqueness (collision < 1 in 10^18)
- 12 chars is human-shareable (not too long)
- Fully indexed in MongoDB for fast lookups
- Prevents URL guessing (much harder than sequential IDs)

**Format:** Generated via `uuid.v4().split('-')[0].substring(0, 12)`

---

### 4. **Password Hashing Strategy**

**Decision:** bcryptjs with 10 salt rounds

**Rationale:**
- Industry standard for password hashing
- 10 rounds ≈ 100ms hashing time (good security/performance balance)
- Automatic salt generation (no additional complexity)
- Resistant to rainbow table attacks

**Trade-off:** Password comparison is slow (~100ms) but acceptable for this use case

---

### 5. **Authentication Model: Optional + Tiered**

**Decision:** Authentication optional for uploading, required for deletion

**Rationale:**
- **Anonymous uploads:** Lower friction for casual users
- **Authenticated uploads:** Link shares to user's dashboard
- **Required for deletion:** Prevents unauthorized content removal
- **Tracks ownership:** userId links shares to authenticated users only

**Security:** Delete requires both authentication AND userId match

---

### 6. **Atomic View Count Increment**

**Decision:** Use MongoDB `findOneAndUpdate` with `$inc` operator

**Rationale:**
- Prevents race conditions (concurrent view increments)
- Database handles atomicity, not Node.js
- Accurate view counting even with simultaneous viewers

```javascript
Share.findOneAndUpdate(
  { shareId },
  { $inc: { viewCount: 1 } },
  { new: true }
)
```

---

### 7. **One-Time View Implementation**

**Decision:** Check `viewCount > 0 && isOneTimeView`, then immediate async deletion

**Rationale:**
- Simple: single boolean flag + viewCount check
- Fast: client gets response immediately
- Safe: deletion happens asynchronously (100ms timeout)
- Clean: both file and DB document deleted

---

### 8. **File Metadata in Database**

**Decision:** Store fileName, fileSize, fileMimeType in MongoDB despite file being in Supabase

**Rationale:**
- Faster metadata queries (no Supabase round-trip)
- Offline metadata access (database available but storage down)
- Dashboard doesn't need actual file content
- Signed URL storage path is fungible

---

### 9. **Error Handling Philosophy**

**Decision:** Client-friendly messages, server-side logging

**Rationale:**
- Users see simple messages ("This link has expired")
- Backend logs full error details for debugging
- Prevents information leakage (no stack traces to clients)

---

### 10. **Expiry Options: Minutes vs DateTime**

**Decision:** Accept both `expiryMinutes` (relative) and `expiryDateTime` (absolute)

**Rationale:**
- Flexibility: users can choose "expires in 30 min" or "expires at 3 PM"
- Validation: both formats have clear constraints
- Default: 10 minutes if neither provided

**Precedence:** expiryDateTime > expiryMinutes > default (10 min)

---

## Assumptions & Limitations

### Assumptions

1. **User Behavior**
   - Users will not upload sensitive data without password protection
   - Share links won't be brute-forced (12-char IDs sufficient)
   - Users understand content expires and plan accordingly

2. **Technical**
   - MongoDB is always available (no offline migrations)
   - Supabase Storage is always available (no local fallback)
   - Network is reasonably reliable (multer in-memory is OK)

3. **Security**
   - Passwords are user-selected (no complexity requirements)
   - HTTPS/TLS is enforced in production (no plaintext transmission)
   - Share links are truly secret (users won't publish them publicly)

4. **Browser/Client**
   - JavaScript is enabled (required for React app)
   - Browser supports multipart file uploads
   - localStorage available for JWT storage

---

### Limitations

#### File Upload
- **Max size:** 50MB per file (multer config limit)
- **Memory:** Files loaded into RAM during upload (not streamed)
- **Formats:** No file type restrictions (security depends on user)
- **Virus scanning:** Not implemented

#### Storage
- **Supabase free tier:** 1GB storage limit
- **File count:** No practical limit but costs scale
- **Retention:** TTL cleanup may take up to 60 seconds

#### Performance
- **Concurrent uploads:** Backend limited by Node.js memory (typical: ~1000/sec)
- **DB queries:** Single MongoDB instance limits read/write throughput
- **Signed URLs:** Expire in 1 hour (can be regenerated on-access)

#### Security
- **Encryption at rest:** Not implemented (Supabase storage unencrypted)
- **Encryption in transit:** Only if HTTPS configured
- **Rate limiting:** Not implemented (no DDoS protection)
- **Password strength:** No validation (user's responsibility)
- **Share link leakage:** No way to prevent if user shares publicly
- **Audit logging:** Not implemented (no access history)

#### Scalability
- **Single MongoDB:** Becomes bottleneck > 1M shares
- **Single Supabase project:** API rate limits apply
- **Backend:** Single Node.js process (use PM2 for multiple)
- **CDN:** Supabase Storage auto-CDN but not globally optimized

#### Features Not Implemented
- Email notifications (share created, expiring, expired)
- QR codes for easy sharing
- Download logging / analytics
- Share revocation (once linked, hard to stop)
- Backup/export of user's shares
- Rate limiting on uploads
- Compression of stored files
- Antivirus scanning
- GDPR data export / deletion

---

## Deployment

### Docker Deployment (Recommended)

```bash
# Build and run
docker-compose up -d

# Containers:
# - frontend: http://localhost:3000
# - backend: http://localhost:5000
# - mongodb: mongodb://localhost:5017
```

### Manual Deployment to Heroku

```bash
# Backend only (frontend can be built and deployed to Netlify, Vercel)
git push heroku main
```

Set environment variables in Heroku dashboard.

### Manual Deployment to Linux Server

```bash
# Clone repo
git clone <repo> /var/www/linkvault

# Backend: Use PM2 for process management
cd /var/www/linkvault/backend
npm install
pm2 start server.js --name "linkvault-backend"
pm2 save
pm2 startup

# Frontend: Build and serve with Nginx
cd /var/www/linkvault/frontend
npm run build
# Copy dist/ to /var/www/html or Nginx root
```

### Environment Setup (Production)

```env
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://yourdomain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Frontend (.env)
VITE_API_URL=https://yourdomain.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

---

## Additional Documentation

- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Detailed MongoDB schema, indexes, queries
- **[DATA_FLOW_ARCHITECTURE.md](./DATA_FLOW_ARCHITECTURE.md)** - Complete data flows from upload to storage to viewing
- **[SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md)** - Supabase configuration guide
- **[SUPABASE_MIGRATION_SUMMARY.md](./SUPABASE_MIGRATION_SUMMARY.md)** - Migration from base64 to cloud storage
- **[EMAIL_RATE_LIMIT_GUIDE.md](./EMAIL_RATE_LIMIT_GUIDE.md)** - Supabase email auth rate limiting
- **[FILE_DOWNLOAD_FIX.md](./FILE_DOWNLOAD_FIX.md)** - Download issues & fixes
- **[ACCOUNT_MIGRATION_GUIDE.md](./ACCOUNT_MIGRATION_GUIDE.md)** - Switching Supabase accounts

---

## Troubleshooting

### Backend won't start
```bash
# Check MongoDB connection
mongo mongodb://localhost:27017/linkvault

# Check environment variables
cat backend/.env

# Check port availability
lsof -i :5000
```

### Files not uploading
```bash
# Check Supabase bucket exists and is public
# Check SUPABASE_SERVICE_KEY is correct
# Check bucket name is "files"
# Verify file size < 50MB
```

### Frontend can't connect to backend
```bash
# Check VITE_API_URL is correct
# Verify backend is running: curl http://localhost:5000/api/health
# Check CORS configuration in backend
```

### Signed URLs expiring
```bash
# URLs expire in 1 hour; backend regenerates on view()
# If regeneration fails, check Supabase permissions
# Manual fix: DELETE and re-upload file
```

---

## Support & Contributing

Found a bug? Have a suggestion?
1. Check existing [issues](https://github.com/vinay6142/LinkVault/issues)
2. Create a new issue with reproduction steps
3. Submit a PR with improvements

---

## License

MIT License - Use freely in personal and commercial projects

---

## Changelog

### v1.0.0 (Current)
- ✅ Supabase Storage integration (cloud files)
- ✅ User authentication (Supabase Auth)
- ✅ Dashboard for authenticated users
- ✅ Password protection
- ✅ One-time view links
- ✅ View count limits
- ✅ Custom expiry times
- ✅ Modern UI with Tailwind CSS
- ✅ Dark mode support
- ✅ Atom view count increment

**v0.1.0** (Legacy)
- Base64 file encoding (replaced by cloud storage)
- Anonymous-only sharing

---

**Happy sharing! 🚀**
