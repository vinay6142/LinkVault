# LinkVault Architecture Diagram

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            User's Browser                               │
│                         (React + Vite App)                              │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │  Upload      │   │  View Share  │   │  Get Info    │
            │  POST/upload │   │POST/view/:id │   │ GET/info/:id │
            └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                   │                  │                  │
                   └──────────────────┼──────────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │   Express.js API        │
                         │   (Backend Server)      │
                         └────────┬────────────────┘
                                  │
          ┌───────────────────────┼────────────────────────┐
          │                       │                        │
          ▼                       ▼                        │
    ┌─────────────────┐    ┌──────────────┐              │
    │   Multer        │    │ Validation   │              │
    │ (File Handler)  │    │  Middleware  │              │
    └────────┬────────┘    └──────┬───────┘              │
             │                    │                       │
             └────────┬───────────┘                       │
                      │                                   │
                      ▼                                   │
         ┌─────────────────────────┐                      │
         │  Business Logic Layer   │                      │
         │ - Generate Share ID     │                      │
         │ - Hash Password         │                      │
         │ - Check Expiry          │                      │
         │ - Track Views           │                      │
         └────────┬────────────────┘                      │
                  │                                       │
                  ▼                                       │
         ┌─────────────────────────┐                      │
         │  Mongoose ODM           │                      │
         │  (Data Validation)       │                      │
         └────────┬────────────────┘                      │
                  │                                       │
                  ▼                                       ▼
         ┌──────────────────────────────────────────────────────┐
         │                   MongoDB                            │
         │                  (Database)                          │
         │                                                      │
         │  Share Collection:                                   │
         │  ├─ shareId (unique, indexed)                       │
         │  ├─ contentType (text/file)                         │
         │  ├─ textContent/fileUrl                             │
         │  ├─ password (hashed)                               │
         │  ├─ expiresAt (TTL indexed)                         │
         │  ├─ viewCount                                       │
         │  └─ metadata                                        │
         └──────────────────────────────────────────────────────┘
```

## Data Flow: Upload Process

```
┌──────────────────┐
│ User in Browser  │
└────────┬─────────┘
         │
         │ 1. Select text/file
         │ 2. Add optional password
         │ 3. Set expiry time
         ▼
    ┌─────────────────────────┐
    │ Frontend Validation     │
    │ - Not both text & file  │
    │ - File size < 50MB      │
    │ - Valid expiry time     │
    └────────┬────────────────┘
             │
             │ 4. Send FormData
             │    (multipart/form-data)
             ▼
    ┌──────────────────────────┐
    │ Express Upload Handler   │
    │ /api/shares/upload       │
    └────────┬─────────────────┘
             │
             │ 5. Multer parses file
             │
             ▼
    ┌───────────────────────────┐
    │ Backend Validation        │
    │ - Check text or file      │
    │ - Verify file size        │
    │ - Ensure expiry > 0       │
    └────────┬──────────────────┘
             │
             │ 6. Generate Share ID
             │    (12-char UUID)
             │
             ▼
    ┌────────────────────────────┐
    │ Hash Password (if set)     │
    │ bcryptjs (10 salt rounds)  │
    └────────┬───────────────────┘
             │
             │ 7. Calculate expiry time
             │    (default: 10 min)
             │
             ▼
    ┌────────────────────────────┐
    │ Create Share Document      │
    │ - shareId                  │
    │ - contentType              │
    │ - content/fileUrl          │
    │ - password (hashed)        │
    │ - expiresAt (for TTL)      │
    │ - viewCount: 0             │
    │ - isExpired: false         │
    └────────┬───────────────────┘
             │
             │ 8. Save to MongoDB
             │
             ▼
    ┌────────────────────────────┐
    │ MongoDB Insert             │
    │ (TTL index set to expiry)  │
    └────────┬───────────────────┘
             │
             │ 9. Return Success
             │
             ▼
    ┌─────────────────────────────┐
    │ Response to Frontend        │
    │ {                           │
    │  shareId: "a1b2c3d4e5f6",  │
    │  shareUrl: "/.../share/...",│
    │  expiresAt: "2024-02-..."   │
    │ }                           │
    └────────┬────────────────────┘
             │
             │ 10. Display link
             │
             ▼
    ┌──────────────────────────┐
    │ Success Modal            │
    │ - Show share URL         │
    │ - Copy to clipboard      │
    │ - Display expiry         │
    └──────────────────────────┘
```

## Data Flow: View/Download Process

```
┌──────────────────┐
│ User Opens Link  │
└────────┬─────────┘
         │
         │ /share/a1b2c3d4e5f6
         │
         ▼
    ┌──────────────────────────┐
    │ Frontend Load SharePage  │
    │ GET /api/shares/info/:id │
    └────────┬─────────────────┘
             │
             │ 1. Fetch share metadata
             │    (without content)
             │
             ▼
    ┌──────────────────────────┐
    │ Backend Endpoint         │
    │ /api/shares/info/:shareId│
    └────────┬─────────────────┘
             │
             │ 2. Find share in DB
             │    by shareId
             │
             ▼
    ┌────────────────────────────────┐
    │ Validation Checks              │
    │ 1. Share exists?               │
    │ 2. Not expired?                │
    │    (compare with expiresAt)    │
    │ 3. Is password protected?      │
    └────────┬──────────────────────┘
             │
             │ 3. If password protected,
             │    prompt user
             │
             ▼
    ┌────────────────────────────────┐
    │ User Submits Password (if req) │
    │ POST /api/shares/view/:shareId │
    │ { password: "user-input" }     │
    └────────┬──────────────────────┘
             │
             │ 4. Verify password
             │    (bcryptjs.compare)
             │
             ▼
    ┌────────────────────────────────┐
    │ More Validation Checks         │
    │ 1. NOT expired?                │
    │ 2. Password correct (if set)?  │
    │ 3. Within view limits (if set)?│
    │ 4. Not already viewed (if OTV)?│
    └────────┬──────────────────────┘
             │
             │ 5. Increment viewCount
             │
             ▼
    ┌────────────────────────────────┐
    │ For One-Time View:             │
    │ - Mark isExpired = true        │
    │ - Schedule deletion            │
    └────────┬──────────────────────┘
             │
             │ 6. Return content
             │    (text or base64 file)
             │
             ▼
    ┌────────────────────────────────┐
    │ Response to Frontend           │
    │ {                              │
    │  contentType: "text/file",     │
    │  content/fileUrl: "...",       │
    │  viewCount: 1                  │
    │ }                              │
    └────────┬──────────────────────┘
             │
             │ 7. Frontend receives
             │    and displays
             │
             ▼
    ┌────────────────────────────────┐
    │ Display Content                │
    │ - For Text:                    │
    │   * Show in textbox            │
    │   * Copy button                │
    │ - For File:                    │
    │   * Show file info             │
    │   * Download button            │
    └────────────────────────────────┘
```

## TTL Index & Auto-Cleanup

```
┌──────────────────────────────┐
│ MongoDB TTL Index Setup      │
│ expiresAt: Date (indexed)    │
│ TTL: expireAfterSeconds: 0   │
└──────────────┬───────────────┘
               │
               │ MongoDB Daemon continuously
               │ scans collection
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
    ┌──────────────┐  ┌──────────────┐
    │ Document     │  │ Document     │
    │ expiresAt    │  │ expiresAt    │
    │ 2024-02-13   │  │ 2024-02-14   │
    │ NOW IS:      │  │ NOW IS:      │
    │ 2024-02-14   │  │ 2024-02-13   │
    │              │  │              │
    │ DELETE       │  │ KEEP         │
    └──────────────┘  └──────────────┘
    (Automatically deleted after expiry timestamp passes)
```

## Component Architecture (Frontend)

```
┌──────────────────────────────────┐
│         App.jsx                  │
│  (Main component, routing)       │
└────────────────┬─────────────────┘
                 │
    ┌────────────┴───────────┐
    │                        │
    ▼                        ▼
┌──────────────┐      ┌──────────────┐
│ HomePage.jsx │      │ SharePage.jsx│
│              │      │              │
│ - Upload UI  │      │ - View Share │
│ - Form       │      │ - Download   │
│ - Success    │      │ - Copy Text  │
└──────┬───────┘      └──────────────┘
       │
       ├─ UploadForm.jsx
       │   ├─ Text/File selection
       │   ├─ Optional settings
       │   └─ Validation
       │
       ├─ SuccessModal.jsx
       │   ├─ Share ID display
       │   ├─ URL copy button
       │   └─ Expiry info
       │
       ├─ Navigation.jsx
       │   ├─ Logo/Title
       │   └─ Dark mode toggle
       │
       └─ SharePage components
           ├─ PasswordPrompt.jsx
           ├─ TextDisplay.jsx
           └─ FileDisplay.jsx

Navigation (All pages):
┌──────────────────────────────────┐
│  Logo + Dark Mode Toggle         │
└──────────────────────────────────┘
```

## Environment & Configuration

```
┌─────────────────────────────────────────┐
│         Development Setup               │
├─────────────────────────────────────────┤
│ Frontend: http://localhost:5173         │
│ Backend:  http://localhost:5000         │
│ MongoDB:  mongodb://localhost:27017     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Production Setup (Docker)          │
├─────────────────────────────────────────┤
│ Frontend: http://linkvault:80           │
│ Backend:  http://linkvault:5000         │
│ MongoDB:  mongodb://linkvault-mongodb   │
└─────────────────────────────────────────┘
```

## Key Security Features

```
1. SHARE ID GENERATION
   UUID → Remove hyphens → Take 12 chars
   Result: Hard to guess unique IDs

2. PASSWORD HASHING
   User Password
       ↓
   bcryptjs (10 salt rounds)
       ↓
   Hashed Password (stored in DB)

3. CONTENT EXPIRY
   Upload Time + Expiry Minutes
       ↓
   Set expiresAt timestamp
       ↓
   MongoDB TTL Index
       ↓
   Auto-delete expired documents

4. ACCESS CONTROL
   Share ID required to access
       ↓
   Database lookup by shareId
       ↓
   Return only to exact URL match
       ↓
   No public listing or search
```

## Scalability Considerations

### Current Implementation (Development)
- Files stored as base64 in MongoDB
- Suitable for < 100MB total data

### Production Improvements
```
Current:
User ─→ File ─→ Base64 ─→ MongoDB

Better:
User ─→ File ─→ S3/Firebase ─→ Store URL ─→ MongoDB
             (Cloud Storage)               (Link only)
Benefits:
- Smaller database
- Faster downloads
- Better scalability
- CDN compatible
```

### Load Balancing
```
Users
  │
  ├─→ Load Balancer (Nginx)
  │
  ├─→ Backend 1 (Node.js)   ─┐
  ├─→ Backend 2 (Node.js)   ─┼─→ MongoDB Replica Set
  └─→ Backend 3 (Node.js)   ─┘

Connection Pooling:
- MongoDB connection pool
- Nginx upstream load balancing
- Session-less stateless design
```
