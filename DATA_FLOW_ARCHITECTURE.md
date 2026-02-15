# LinkVault Data Flow & Architecture Documentation

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LinkVault Architecture                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   USER BROWSER (React)   │
│                          │
│ ┌──────────────────────┐ │
│ │  Frontend App        │ │
│ │  - Pages             │ │
│ │  - Components        │ │
│ │  - State Management  │ │
│ └──────────────────────┘ │
│         │                │
│         │ (HTTP/HTTPS)   │
│         ↓                │
│ ┌──────────────────────┐ │
│ │  Supabase Auth       │ │
│ │  (JWT Management)    │ │
│ └──────────────────────┘ │
└──────────────────────────┘
         │
         │ REST API Calls + JWT
         │
         ↓
┌──────────────────────────────────────────┐
│      BACKEND SERVER (Express.js)         │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │  Routes & Controllers                │ │
│ │  - POST /api/shares/upload           │ │
│ │  - POST /api/shares/view/:shareId    │ │
│ │  - DELETE /api/shares/delete         │ │
│ │  - GET /api/shares/user-shares       │ │
│ │  - GET /api/shares/info              │ │
│ └──────────────────────────────────────┘ │
│         │                  │              │
│         │                  │              │
│         ↓                  ↓              │
│ ┌──────────────────┐ ┌──────────────────┐│
│ │ MongoDB Driver   │ │Supabase Client   ││
│ │ (Mongoose ORM)   │ │ (File Storage)   ││
│ └──────────────────┘ └──────────────────┘│
│         │                  │              │
└─────────┼──────────────────┼──────────────┘
          │                  │
          │                  │
          ↓                  ↓
    ┌─────────────┐    ┌────────────────────────┐
    │  MongoDB    │    │ Supabase Storage       │
    │  (Metadata) │    │ (File Bytes)           │
    └─────────────┘    └────────────────────────┘
          │                    │
          │                    │
    [Database]            [Cloud Files]
```

---

## Complete Request/Response Flow for File Upload

### Step 1: User Initiates Upload

```
User Browser
  │
  └─> UploadForm.jsx
        ├─ Collects: file or text
        ├─ Collects: password (optional)
        ├─ Collects: expiry options
        ├─ Collects: one-time view (optional)
        ├─ Collects: max view count (optional)
        └─> Validates locally
              ├─ File size < 50MB
              ├─ Not both text and file
              └─> Reads file into memory (FileReader API)
```

### Step 2: Send to Backend

```
Frontend (React)
  │
  └─> api.js (Axios instance)
        ├─ Creates FormData object
        ├─ Appends file or text
        ├─ Appends metadata (password, expiry, etc.)
        ├─ Adds Authorization header with JWT token
        │
        └─> HTTP POST /api/shares/upload
            Headers:
            - Authorization: Bearer {JWT_TOKEN}
            - Content-Type: multipart/form-data
```

### Step 3: Backend Receives Upload

```
Backend (Express)
  │
  └─> POST /api/shares/upload (middlware chain)
        │
        ├─> Multer Middleware
        │   │
        │   └─> Parse multipart/form-data
        │       ├─ Extract file buffer (if provided)
        │       ├─ Extract text content (if provided)
        │       ├─ Extract password, expiry, options
        │       │
        │       └─> [File in memory: Buffer object]
        │
        ├─> optionalAuthMiddleware
        │   │
        │   └─> Verify JWT token (optional)
        │       ├─ Extract from: Authorization header
        │       ├─ Verify with Supabase
        │       └─> Set req.userId (or null if anonymous)
        │
        └─> Route Handler (async)
```

### Step 4: Validation & ID Generation

```
Upload Route Handler
  │
  ├─> Validation Phase
  │   ├─ Check: text OR file provided (not both, not neither)
  │   ├─ Check: If file, size < 50MB
  │   ├─ Check: If password, length ≥ 4
  │   ├─ Check: If expiryDateTime, is future date
  │   ├─ Check: If expiryMinutes, is 1-1440
  │   └─ Return 400 errors if validation fails
  │
  ├─> Generate Unique ID
  │   │
  │   └─> shareId = generateShareId()
  │       └─ 12-character random alphanumeric string
  │
  └─> Calculate Expiry Time
      ├─ If expiryDateTime provided: use that
      ├─ If expiryMinutes provided: now + minutes
      └─ Else: now + 10 minutes (default)
```

### Step 5: File Upload to Supabase (if file share)

```
For File Content:
  │
  └─> uploadFileToStorage(file.buffer, fileName, shareId)
      │
      ├─> Supabase Client
      │   │
      │   └─> Upload file bytes to Storage
      │       ├─ Bucket: "files"
      │       ├─ Path: {shareId}/{originalFileName}
      │       ├─ Access: Authenticated Supabase key
      │       │
      │       └─> [File bytes stored in cloud]
      │
      └─> Supabase Response
          ├─ Success: return filePath, fileSize
          └─ Error: return error (500 to client)
```

### Step 6: Generate Signed URL

```
For File Content:
  │
  └─> getSignedUrl(filePath, 3600)
      │
      ├─> Supabase Client
      │   │
      │   └─> Generate time-limited signed URL
      │       ├─ Path: file path in storage
      │       ├─ Expiry: 1 hour (3600 seconds)
      │       ├─ Includes signature token
      │       │
      │       └─> URL valid until expiry
      │
      └─> Returns: https://...?token=abc123&expires=1234567890
          Note: URL expires after 1 hour, but share might expire sooner
```

### Step 7: Hash Password (if protected)

```
If password provided:
  │
  └─> hashPassword(password)
      │
      ├─> bcryptjs.hash()
      │   ├─ Salt rounds: 10
      │   ├─ Input: plain text password
      │   │
      │   └─> Output: $2a$10$....... (hashed)
      │
      └─> [Password hash ready for storage]
```

### Step 8: Create & Save to Database

```
Prepare Share Document:
  │
  ├─> shareData = {
  │     shareId: '12-char-id',
  │     userId: req.userId || null,      // null if anonymous
  │     contentType: 'file' || 'text',
  │
  │     // For file shares:
  │     fileName: 'document.pdf',
  │     storagePath: 'shareId/document.pdf',
  │     fileUrl: 'https://...signed-url...',
  │     fileSize: 1024000,
  │     fileMimeType: 'application/pdf',
  │
  │     // For text shares:
  │     textContent: 'The actual text content',
  │
  │     // Security:
  │     password: hashedPassword || null,
  │     isPasswordProtected: !!password,
  │
  │     // Access control:
  │     isOneTimeView: boolean,
  │     maxViewCount: number || null,
  │     viewCount: 0,
  │
  │     // Timestamps:
  │     createdAt: new Date(),
  │     expiresAt: calculateExpiryTime(),
  │     isExpired: false
  │   }
  │
  └─> MongoDB Insert
      │
      ├─> new Share(shareData)
      ├─> await share.save()
      │
      └─> MongoDB Response
          ├─ Document saved with _id
          └─> [Document persisted to database]
```

### Step 9: Return Response to Frontend

```
Backend Response (201 Created)
  │
  └─> JSON Response {
      success: true,
      shareId: 'abc123def456',
      shareUrl: 'http://localhost:5173/share/abc123def456',
      expiresAt: '2026-02-15T10:15:00.000Z'
      }
```

### Step 10: Frontend Displays Success

```
Frontend receives response
  │
  └─> SuccessModal.jsx
      ├─ Displays link: /share/{shareId}
      ├─ Shows expiry time: "Expires in 10 minutes"
      ├─ Copy to clipboard button
      └─> User shares link with others
```

---

## Data Flow for Viewing a Share

```
┌─────────────────────────────────────────────────────────────────┐
│                   SHARE VIEW FLOW                               │
└─────────────────────────────────────────────────────────────────┘

User opens shared link: http://linkvault.app/share/abc123def456

1. Frontend Load
   │
   └─> SharePage.jsx
       │
       └─> GET /api/shares/info/abc123def456
           └─> Returns metadata (no content)
               ├─ contentType: 'file' or 'text'
               ├─ isPasswordProtected: true/false
               ├─ isOneTimeView: true/false
               ├─ expiresAt: timestamp
               └─> Render UI based on metadata

2. User Views Content
   │
   └─> POST /api/shares/view/abc123def456
       │ (with password in body if protected)
       │
       ├─> Find share in MongoDB
       ├─> Check expiry (if expired, delete and return 404)
       ├─> If password protected, verify password
       ├─> If one-time view, check already viewed
       ├─> If max views, check limit not reached
       ├─> Increment viewCount (atomic operation)
       │
       └─> Response:
           For Text:
           {
             contentType: 'text',
             content: 'The actual text',
             viewCount: 1
           }

           For File:
           {
             contentType: 'file',
             fileName: 'document.pdf',
             fileUrl: 'https://...signed-url...',
             fileSize: 1024000,
             fileMimeType: 'application/pdf',
             viewCount: 1
           }

3. Frontend Displays Content
   │
   └─> For Text:
       └─> TextDisplay.jsx
           ├─ Display text content
           ├─ Show copy button
           └─> Optional: Syntax highlighting

   └─> For File:
       └─> FileDisplay.jsx
           ├─ Show file metadata (name, size)
           ├─ Preview if possible (images, PDFs)
           ├─ Download button (uses signed URL)
           └─> Browser downloads file

4. If One-Time View
   │
   └─> After response sent to user:
       ├─ setTimeout 100ms
       ├─ Delete file from Supabase Storage
       ├─ Delete share document from MongoDB
       └─> Link becomes invalid for future access
```

---

## Authentication & Token Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW                                │
└─────────────────────────────────────────────────────────────────┘

Frontend:
  │
  └─> User clicks "Sign Up"
      │
      └─> SignupPage.jsx
          │
          └─> supabaseClient.auth.signUp({
              email: 'user@example.com',
              password: 'secure_password'
            })
            │
            └─> Supabase Response:
                ├─ Creates auth.users record
                ├─ Creates profiles table record
                ├─ Returns user object + session
                │
                └─> Frontend stores in localStorage
                    ├─ Key: sb-{projectId}-auth-token
                    ├─ Value: {
                    │   access_token: 'eyJ0eXAi...',
                    │   refresh_token: 'eyJ0eXAi...',
                    │   user: { id, email, ... }
                    │   }
                    └─> Token stored securely

User makes request to backend:
  │
  ├─> Frontend reads token from localStorage
  ├─> Adds Authorization header
  │
  └─> API Request:
      POST /api/shares/upload
      Headers:
      - Authorization: Bearer eyJ0eXAi...
      - Content-Type: multipart/form-data

Backend verification:
  │
  └─> optionalAuthMiddleware
      │
      ├─> Extract token from Authorization header
      ├─> Split: "Bearer {token}"
      │
      └─> supabaseClient.auth.getUser(token)
          │
          ├─> Supabase verifies JWT signature
          ├─> Validates token NOT expired
          │
          └─> Returns user object:
              ├─ id: 'uuid'
              ├─ email: 'user@example.com'
              ├─ success: true/false
              │
              └─> Backend attaches to request:
                  ├─ req.userId = user.id
                  ├─ req.user = full user object

Route handler receives authenticated request:
  │
  └─> if (req.userId) { /* authenticated */ }
      else { /* anonymous */ }
```

---

## Dashboard & User Shares Flow

```
┌─────────────────────────────────────────────────────────────────┐
│         DASHBOARD & USER SHARES FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User visits /dashboard (protected route):
  │
  ├─> AuthProtection.jsx checks authentication
  ├─> If not authenticated, redirect to /login
  ├─> If authenticated, render DashboardPage.jsx
  │
  └─> DashboardPage.jsx mounted:
      │
      └─> GET /api/shares/user-shares
          │ (request includes Authorization header with JWT)
          │
          ├─> Backend optionalAuthMiddleware:
          │   └─> Verify token, set req.userId
          │
          ├─> Route handler:
          │   ├─ Check if req.userId exists (401 if not)
          │   ├─ Query MongoDB:
          │   │   db.shares.find({ userId: req.userId })
          │   │   .sort({ createdAt: -1 })
          │   │   .select({ textContent: 0, fileUrl: 0, password: 0 })
          │   │     (exclude sensitive data)
          │   │
          │   └─> Returns array of user's shares
          │       {
          │         success: true,
          │         shares: [
          │           {
          │             shareId: 'abc123',
          │             contentType: 'file',
          │             fileName: 'document.pdf',
          │             fileSize: 1024000,
          │             isPasswordProtected: false,
          │             isOneTimeView: false,
          │             viewCount: 3,
          │             maxViewCount: null,
          │             expiresAt: '2026-02-15T10:15:00.000Z',
          │             createdAt: '2026-02-15T10:05:00.000Z'
          │           },
          │           ...
          │         ],
          │         count: 12
          │       }
          │
          └─> Frontend render list
              │
              └─> For each share:
                  ├─ Display metadata
                  ├─ Show copy link button
                  ├─ Show delete button
                  ├─ Show expiry countdown
                  └─> User can delete if owner

Delete share from dashboard:
  │
  └─> User clicks "Delete"
      │
      └─> DELETE /api/shares/delete/{shareId}
          │ (with Authorization header)
          │
          ├─> Backend verifies authentication (401 if missing)
          ├─> Query MongoDB for share
          ├─> Check userId matches (403 if doesn't match)
          ├─> If file share, delete from Supabase Storage
          ├─> Delete share from MongoDB
          │
          └─> Return success response
              │
              └─> Frontend removes from list
```

---

## File Deletion & Cleanup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           FILE DELETION & CLEANUP FLOW                          │
└─────────────────────────────────────────────────────────────────┘

Three cleanup mechanisms:

1. ON-DEMAND CLEANUP (User views)
   │
   └─> POST /api/shares/view/:shareId
       │
       ├─> Check if share.expiresAt < now
       │
       └─> If expired:
           ├─> deleteFileFromStorage(share.storagePath)
           │   └─> Supabase Storage API
           │       └─> DELETE /storage/v1/object/files/{path}
           │
           ├─> await Share.deleteOne({ shareId })
           │   └─> MongoDB delete
           │
           └─> Return 404 error


2. MANUAL DELETION (User deletes)
   │
   └─> DELETE /api/shares/delete/:shareId
       │
       ├─> Authenticate user (401 if not)
       ├─> Find share by shareId
       ├─> Check ownership: share.userId === req.userId (403 if not)
       │
       ├─> If file share:
       │   └─> deleteFileFromStorage(share.storagePath)
       │       └─> Supabase Storage API delete
       │
       ├─> await Share.deleteOne({ shareId })
       │   └─> MongoDB delete
       │
       └─> Return success response


3. SCHEDULED CLEANUP (Backend job every 5 minutes)
   │
   └─> cleanupExpiredShares.js
       │
       ├─> Schedule: Every 5 minutes (cron/setInterval)
       │
       └─> Execution:
           ├─> Query: find all shares where expiresAt < now
           │   db.shares.find({ expiresAt: { $lt: new Date() } })
           │
           ├─> For each expired share:
           │   │
           │   ├─> If contentType === 'file' AND storagePath:
           │   │   └─> deleteFileFromStorage(storagePath)
           │   │       └─> Supabase delete
           │   │
           │   └─> await Share.deleteOne({ shareId })
           │       └─> MongoDB delete
           │
           └─> Log number of deleted shares


4. MONGODB TTL CLEANUP (Automatic every 60 seconds)
   │
   └─> MongoDB daemon:
       │
       ├─> Index: { expiresAt: 1 } with expireAfterSeconds: 0
       │
       └─> Every 60 seconds:
           ├─> Scan expiresAt field
           ├─> Find documents where expiresAt < now
           │
           └─> Automatically delete
               (Note: Happens after Supabase cleanup)
```

---

## Performance Flow Diagram

```
Upload Performance:
  └─ User Browser (file in memory)
      ├─ Validation: ~5ms
      ├─ Browser upload: ~100-500ms (network dependent)
      └─ Backend:
          ├─ Multer parse: ~50ms
          ├─ Auth verify: ~20ms
          ├─ File hash: ~100ms
          ├─ Supabase upload: ~500-2000ms (file size dependent)
          ├─ Signed URL gen: ~50ms
          ├─ Password hash: ~200ms (bcrypt, 10 rounds)
          └─ MongoDB insert: ~50ms
              TOTAL: ~1-3 seconds

View Performance:
  └─ User Browser
      ├─ GET /info: ~100ms (DB lookup + validation)
      ├─ POST /view (text): ~100ms (DB lookup + validation)
      ├─ POST /view (file): ~100ms + download speed
      │   └─ File download uses signed URL
      │   └─ CDN cached (from Supabase)
      │   └─ ~1-10Mbps typical
      └─ Total perceived time: <200ms

Delete Performance:
  └─ For typical 1MB file:
      ├─ Supabase Storage delete: ~100ms
      ├─ MongoDB delete: ~50ms
      └─ TOTAL: ~150ms
```

---

## Scalability Considerations

### Current Architecture Limits

```
Single MongoDB Instance:
├─ Insertions: ~1000 writes/sec
├─ Queries: ~10,000 reads/sec
├─ Storage: Up to 512GB (local)
└─> Scales well for < 1 million shares

Single Supabase Project:
├─ API calls: ~1000 req/sec (free tier)
├─ Storage: Up to 5GB free tier
├─> Scales well for uploads < 100/min
```

### Scaling Paths (if needed)

```
MongoDB:
├─ Add replica sets (HA)
├─ Implement sharding by shareId
├─ Add caching layer (Redis)
└─> Can handle 1B+ documents

Supabase Storage:
├─ Already distributed globally
├─ Automatic CDN caching
├─ Can store petabytes
└─> Unlimited scalability

Backend:
├─ Run multiple Node.js instances
├─ Load balance with Nginx
├─ Use message queues for async jobs
└─> Can handle 1000s requests/sec
```

---

## Error Handling Flow

```
Common Error Scenarios:

1. Expired Share
   User-friendly: "This link has expired"
   Flow:
     GET /share/{shareId}
       → Backend checks expiresAt
       → If expired: DELETE from storage + DB
       → Return 404 "Content has expired"

2. Wrong Password
   Flow:
     POST /view/{shareId} (wrong password)
       → Backend compares bcrypt hash
       → No match: Return 403 "Invalid password"
       → Don't increment viewCount

3. One-Time Link Already Used
   Flow:
     POST /view/{shareId} (second time)
       → Check viewCount > 0 && isOneTimeView
       → Return 403 "Can only be viewed once"

4. File Upload Too Large
   Flow:
     POST /upload (file > 50MB)
       → Multer rejects: file exceeds limit
       → Return 413 Payload Too Large

5. Network Error During Upload
   Flow:
     User cancelled or network failed
       → Partial file in Supabase storage
       → Cleanup job removes orphaned files daily
       → Frontend shows: "Upload failed, try again"
```

---

## Summary: Data Lifecycle

```
1. CREATE
   └─> User uploads file/text
   └─> generateShareId()
   └─> Supabase Storage (if file)
   └─> MongoDB Share document
   └─> Return shareId + URL

2. READ
   └─> User visits /share/{shareId}
   └─> GET /api/shares/info (metadata)
   └─> POST /api/shares/view (content)
   └─> Increment viewCount
   └─> Return content or file URL

3. UPDATE
   └─> View increment (atomic)
   └─> isExpired flag (automatic)
   └─> fileUrl regeneration (on-demand)

4. DELETE
   └─> User manual delete (authenticated)
   └─> Expired share (scheduled job)
   └─> MongoDB document deleted
   └─> Supabase file deleted
   └─> TTL index cleanup (automatic)

5. RETENTION
   └─> Default: 10 minutes
   └─> Custom: 1 minute - 24 hours
   └─> One-time: immediate after view
   └─> Max cleanup delay: 60 seconds (TTL daemon)
```
