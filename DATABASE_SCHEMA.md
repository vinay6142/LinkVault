# LinkVault Database Schema Documentation

## Overview

LinkVault uses **MongoDB** as its primary database for storing share metadata and **Supabase Storage** for file storage with signed URLs.

---

## MongoDB Collections

### 1. Share Collection

The core collection for storing all share information (files and text).

#### Schema Definition

```javascript
{
  _id: ObjectId,                          // MongoDB auto-generated ID

  // Share Identification
  shareId: String (unique, indexed),      // Custom 12-char unique identifier
  userId: String (nullable, indexed),     // User ID from Supabase (null for anonymous)

  // Content Type & Storage
  contentType: String (enum),             // 'text' or 'file'
  textContent: String (nullable),         // Raw text content (if text share)

  // File Metadata
  fileName: String (nullable),            // Original file name
  fileUrl: String (nullable),             // Signed URL from Supabase Storage
  storagePath: String (nullable),         // Path in Supabase: {shareId}/{fileName}
  fileSize: Number (nullable),            // File size in bytes
  fileMimeType: String (nullable),        // MIME type (e.g., image/png)

  // Security & Access Control
  password: String (nullable),            // bcryptjs hashed password (10 salt rounds)
  isPasswordProtected: Boolean,           // Flag indicating password protection
  isOneTimeView: Boolean,                 // Deleted after first view
  viewCount: Number,                      // Track number of views
  maxViewCount: Number (nullable),        // Maximum allowed views (null = unlimited)

  // Expiry Management
  createdAt: Date,                        // Timestamp of share creation
  expiresAt: Date (indexed),              // Auto-deletion timestamp
  isExpired: Boolean                      // Manual expiry flag
}
```

#### Field Details

| Field | Type | Required | Indexed | Purpose |
|-------|------|----------|---------|---------|
| `shareId` | String | Yes | Yes | Unique identifier for the share (12-char random) |
| `userId` | String | No | Yes | Links share to authenticated user for dashboard |
| `contentType` | Enum | Yes | No | Determines if content is 'text' or 'file' |
| `textContent` | String | No | No | Stores plain text content directly in DB |
| `fileName` | String | No | No | Original filename for file downloads |
| `fileUrl` | String | No | No | Time-limited signed URL from Supabase |
| `storagePath` | String | No | No | Path to file in Supabase Storage |
| `fileSize` | Number | No | No | File size in bytes (for UI display) |
| `fileMimeType` | String | No | No | MIME type for proper download headers |
| `password` | String | No | No | Bcrypt hashed password for protected shares |
| `isPasswordProtected` | Boolean | Yes | No | Flag to trigger password prompt on frontend |
| `isOneTimeView` | Boolean | Yes | No | Automatic deletion after first access |
| `viewCount` | Number | Yes | No | Incremented on each view |
| `maxViewCount` | Number | No | No | Limits total views (null = unlimited) |
| `createdAt` | Date | Yes | No | Share creation timestamp |
| `expiresAt` | Date | Yes | Yes | MongoDB TTL index triggers auto-deletion |
| `isExpired` | Boolean | Yes | No | Manual flag (also auto-cleanup via TTL) |

---

#### Indexes

```javascript
// Index 1: Unique share identifier
db.shares.createIndex({ shareId: 1 }, { unique: true })

// Index 2: User dashboard queries
db.shares.createIndex({ userId: 1 })

// Index 3: MongoDB TTL Index - Automatic deletion
db.shares.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

**TTL Index Explanation:**
- MongoDB automatically deletes documents when `expiresAt` passes the current time
- Runs every 60 seconds (default TTL background task)
- Supplements the backend cleanup job (every 5 minutes)
- Deletes file from Supabase Storage before DB document deletion (via backend job)

---

## Data Models (Code)

### Share Model

```javascript
// backend/models/Share.js
import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema({
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    default: null,
    index: true,
  },
  contentType: {
    type: String,
    enum: ['text', 'file'],
    required: true,
  },
  textContent: {
    type: String,
    default: null,
  },
  fileName: {
    type: String,
    default: null,
  },
  fileUrl: {
    type: String,
    default: null,
  },
  storagePath: {
    type: String,
    default: null,
  },
  fileSize: {
    type: Number,
    default: null,
  },
  fileMimeType: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    default: null,
  },
  isPasswordProtected: {
    type: Boolean,
    default: false,
  },
  isOneTimeView: {
    type: Boolean,
    default: false,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  maxViewCount: {
    type: Number,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  isExpired: {
    type: Boolean,
    default: false,
  },
});

// TTL index for automatic document deletion
shareSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Share = mongoose.model('Share', shareSchema);

export default Share;
```

---

## Example Documents

### Text Share (Password Protected)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "shareId": "abc123def456",
  "userId": null,
  "contentType": "text",
  "textContent": "This is my secret message",
  "fileName": null,
  "fileUrl": null,
  "storagePath": null,
  "fileSize": null,
  "fileMimeType": null,
  "password": "$2a$10$kN.Zl5...",
  "isPasswordProtected": true,
  "isOneTimeView": false,
  "viewCount": 2,
  "maxViewCount": null,
  "createdAt": "2026-02-15T10:00:00.000Z",
  "expiresAt": "2026-02-15T10:15:00.000Z",
  "isExpired": false
}
```

### File Share (Authenticated User, One-Time View)

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "shareId": "xyz789pqr012",
  "userId": "user_abc123def456",
  "contentType": "file",
  "textContent": null,
  "fileName": "presentation.pdf",
  "fileUrl": "https://project.supabase.co/storage/v1/object/sign/files/xyz789pqr012/presentation.pdf?token=abc123&expires=1771153821",
  "storagePath": "xyz789pqr012/presentation.pdf",
  "fileSize": 2548576,
  "fileMimeType": "application/pdf",
  "password": null,
  "isPasswordProtected": false,
  "isOneTimeView": true,
  "viewCount": 0,
  "maxViewCount": null,
  "createdAt": "2026-02-15T10:05:00.000Z",
  "expiresAt": "2026-02-15T11:05:00.000Z",
  "isExpired": false
}
```

### File Share (View Limited)

```json
{
  "_id": "507f1f77bcf86cd799439013",
  "shareId": "mno456stu789",
  "userId": "user_xyz789abc123",
  "contentType": "file",
  "textContent": null,
  "fileName": "document.docx",
  "fileUrl": "https://project.supabase.co/storage/v1/object/sign/files/mno456stu789/document.docx?token=xyz789&expires=1771153821",
  "storagePath": "mno456stu789/document.docx",
  "fileSize": 524288,
  "fileMimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "password": null,
  "isPasswordProtected": false,
  "isOneTimeView": false,
  "viewCount": 3,
  "maxViewCount": 5,
  "createdAt": "2026-02-15T09:00:00.000Z",
  "expiresAt": "2026-02-16T09:00:00.000Z",
  "isExpired": false
}
```

---

## Database Relationships

```
┌─────────────────────────────────────┐
│         Supabase Auth (Postgres)    │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  auth.users                  │  │
│  ├──────────────────────────────┤  │
│  │ id (UUID)                    │  │
│  │ email                        │  │
│  │ created_at                   │  │
│  └──────────────────────────────┘  │
│           │                        │
│           │ 1:N relationship       │
│           ↓                        │
│  ┌──────────────────────────────┐  │
│  │  public.profiles (Postgres)  │  │
│  ├──────────────────────────────┤  │
│  │ id (UUID, FK to auth.users)  │  │
│  │ email                        │  │
│  │ display_name                 │  │
│  │ created_at                   │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
         │
         │ userId reference
         ↓
┌─────────────────────────────────────┐
│    MongoDB (shares collection)      │
│                                     │
│ ┌──────────────────────────────┐   │
│ │  shares                      │   │
│ ├──────────────────────────────┤   │
│ │ _id: ObjectId                │   │
│ │ shareId: String (unique)     │   │
│ │ userId: String (nullable)    │   │
│ │ contentType: 'text'|'file'   │   │
│ │ ... (other fields)           │   │
│ └──────────────────────────────┘   │
│         │                          │
│         │ storagePath reference    │
│         ↓                          │
│ ┌──────────────────────────────┐   │
│ │  File Metadata               │   │
│ │  fileName, fileSize, etc.    │   │
│ └──────────────────────────────┘   │
└─────────────────────────────────────┘
         │
         │ storagePath reference
         ↓
┌─────────────────────────────────────┐
│   Supabase Storage (cloud files)    │
│                                     │
│   /files/{shareId}/{fileName}       │
│   Raw file bytes                    │
└─────────────────────────────────────┘
```

---

## Query Patterns

### Common Queries in Application

#### 1. Find Share by ID
```javascript
Share.findOne({ shareId: 'abc123def456' })
// Returns: Full share document
// Used in: View, Delete, Info endpoints
// Index: shareId (unique)
```

#### 2. List User's Shares
```javascript
Share.find(
  { userId: 'user_abc123def456' },
  { textContent: 0, fileUrl: 0, password: 0 }
).sort({ createdAt: -1 })
// Returns: User shares without sensitive data
// Used in: Dashboard, User shares endpoint
// Index: userId
```

#### 3. Find Expired Shares
```javascript
Share.find({ expiresAt: { $lt: new Date() } })
// Returns: All expired documents
// Used in: Cleanup job
// Index: expiresAt (TTL)
```

#### 4. Increment View Count
```javascript
Share.findOneAndUpdate(
  { shareId: 'abc123def456' },
  { $inc: { viewCount: 1 } },
  { new: true }
)
// Atomic increment to prevent race conditions
// Used in: View endpoint
// Index: shareId
```

---

## Constraints & Validations

### Application-Level Validations

| Field | Validation | Reason |
|-------|-----------|--------|
| `shareId` | Length: 12, alphanumeric | Unique identifier format |
| `password` | Length: ≥4, bcrypt hash | Security, storage |
| `fileSize` | ≤50MB (50*1024*1024 bytes) | Server memory, storage limits |
| `expiryMinutes` | 1-1440 (1 min - 24 hours) | Reasonable expiry range |
| `expiryDateTime` | Must be future time | Cannot be in past |
| `maxViewCount` | ≥1, integer | Must be positive |
| `contentType` | 'text' OR 'file' | Enum constraint |
| `text` XOR `file` | Exactly one provided | Cannot both/neither |

---

## Storage Strategy

### MongoDB Storage

**Use MongoDB for:**
- Share metadata (timestamps, counts, settings)
- Text content (small documents)
- File metadata references (path, size, type)

**Size estimate per text share:** ~500 bytes - 1 KB
**Size estimate per file share:** ~300 bytes (metadata only)

### Supabase Storage

**Use Supabase Storage for:**
- Actual file bytes (not in DB)
- Any file >5MB

**Storage path:** `files/{shareId}/{fileName}`

**Advantages:**
- Scalable to terabytes
- Automatic CDN distribution
- Signed URLs for time-limited access
- Cost-effective for large files

---

## Cleanup Strategy

### Dual Cleanup Mechanism

#### 1. MongoDB TTL Index (Automatic)
- **When:** MongoDB daemon runs every ~60 seconds
- **Action:** Deletes document when `expiresAt` passes
- **Limitation:** Only deletes MongoDB doc, not Supabase file

#### 2. Backend Job (Scheduled)
- **When:** Runs every 5 minutes (configurable)
- **Action:**
  - Finds expired shares
  - Deletes file from Supabase Storage first
  - Then deletes MongoDB document
- **Advantage:** Ensures files are cleaned up

#### 3. On-Access Cleanup (Reactive)
- **When:** User views an expired share
- **Action:**
  - Checks `expiresAt` timestamp
  - If expired, deletes file and document
  - Returns 404 error
- **Advantage:** Immediate cleanup without waiting

---

## Performance Considerations

### Index Strategy

```
Index: { shareId: 1 } (UNIQUE)
  Used for: /share/{shareId}, delete, view operations
  Lookup Time: O(log n)

Index: { userId: 1 }
  Used for: dashboard queries
  Lookup Time: O(log n)
  Range Query: O(log n + k) where k = number of results

Index: { expiresAt: 1 } (TTL)
  Used for: automatic cleanup
  Lookup Time: O(log n)
  Also scanned by MongoDB TTL daemon every 60s
```

### Query Optimization

- **Projection:** Exclude sensitive fields (password, textContent) when listing
- **Indexing:** All frequently queried fields are indexed
- **Atomic Operations:** Use `findOneAndUpdate` for view increment (prevents race conditions)

---

## Backup & Data Integrity

### MongoDB Backup Strategy

- Daily automated backups (Atlas)
- Point-in-time recovery (30 days)
- Replicated across 3 nodes (default replica set)

### File Backup Strategy

- Supabase Storage has automatic versioning
- Files backed up to multiple regions
- Storage redundancy enabled

---

## Security Considerations

### Data Sensitivity

| Field | Sensitivity | Protection |
|-------|-------------|------------|
| `password` | High | Bcrypt hash (never stored plain) |
| `textContent` | User-defined | Optional password protection |
| `fileUrl` | Medium | Signed URL (expires in 1 hour) |
| `storagePath` | Medium | Not exposed to frontend directly |
| `userId` | Medium | Only visible to share owner |

### Access Control

- **Anonymous shares:** No userId, publicly accessible
- **Authenticated shares:** userId linked, deletable only by owner
- **Password-protected:** Additional verification required
- **One-time links:** Immediate deletion after view

---

## Future Considerations

### Scalability

- **Sharding:** If shares exceed millions, shard by `shareId` or `userId`
- **Caching:** Redis cache for frequently accessed shares
- **Archive:** Move old shares to cold storage

### Enhancements

- Add share expiry to user control panel
- Track download/view analytics
- Implement share refresh tokens
- Add audit logging for sensitive operations
