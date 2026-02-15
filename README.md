# LinkVault - Secure File & Text Sharing

A full-stack web application built with React, Node.js, Express.js, and MongoDB that allows users to upload and share files or text securely using unique, shareable links.

## Project Overview

LinkVault is a Pastebin-like application where users can:
- Upload plain text or files (not both in a single share)
- Receive a unique, hard-to-guess shareable URL
- Share content with password protection (optional)
- Enable one-time view access (optional)
- Set custom expiry times (default: 10 minutes)
- View and download shared content via the link
- Automatically delete expired content

## Architecture

### High-Level Data Flow

```
User Browser (Frontend)
    ↓
    ├─→ [Upload] → Express.js API
    │              ↓
    │         Multer (File Processing)
    │              ↓
    │         MongoDB Document Creation
    │              ↓
    │         [Response with Share URL]
    │         ← (Back to Frontend)
    │
    └─→ [Access Share] → Express.js API
                        ↓
                   Validate Share ID
                        ↓
                   Check Expiry
                        ↓
                   Verify Password (if protected)
                        ↓
                   Check View Count (if limited)
                        ↓
                   Return Content to Browser
                        ↓
                   [Display/Download]
```

## Tech Stack

### Frontend
- **React 18** - UI Framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **Multer** - File upload middleware
- **bcryptjs** - Password hashing
- **uuid** - Unique ID generation

## Features

### Core Features
1. **Text Upload** - Share plain text with copy-to-clipboard functionality
2. **File Upload** - Upload files up to 50MB with secure download links
3. **Unique Share Links** - Hard-to-guess 12-character share IDs
4. **Automatic Expiry** - Content expires after 10 minutes by default (configurable)
5. **Access Control** - Content only accessible via direct link
6. **Link-based Access** - No authentication required
7. **View Count Tracking** - Track number of views

### Optional Features (Implemented)
1. **Password Protection** - Optional password-protected shares
2. **One-Time View** - Content deleted after first view
3. **Custom Expiry** - Set custom expiration times
4. **Manual Delete** - Delete shares before expiry
5. **Share Info** - View share metadata without accessing content
6. **Dark Mode** - Light/dark theme toggle

### Security Features
- Unique share IDs prevent URL guessing
- Password hashing using bcryptjs
- MongoDB TTL indexes for automatic cleanup
- CORS enabled for cross-origin requests
- Input validation on frontend and backend

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` file:
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/linkvault
FRONTEND_URL=http://localhost:5173
```

3. **Start MongoDB** (if running locally)
```bash
mongod
```

4. **Run Development Server**
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Run Development Server**
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

3. **Build for Production**
```bash
npm run build
```

## API Endpoints

### Upload Share
**POST** `/api/shares/upload`

Request (multipart/form-data):
```json
{
  "text": "Text content to share",
  "file": "[File object]",
  "password": "optional-password",
  "isOneTimeView": true,
  "expiryMinutes": 30
}
```

Response:
```json
{
  "success": true,
  "shareId": "a1b2c3d4e5f6",
  "shareUrl": "http://localhost:5173/share/a1b2c3d4e5f6",
  "expiresAt": "2024-02-13T10:35:00Z"
}
```

### View Share
**POST** `/api/shares/view/:shareId`

Request:
```json
{
  "password": "optional-password"
}
```

Response (for text):
```json
{
  "success": true,
  "contentType": "text",
  "content": "Shared text content",
  "viewCount": 1
}
```

Response (for file):
```json
{
  "success": true,
  "contentType": "file",
  "fileName": "document.pdf",
  "fileUrl": "[base64-encoded-file]",
  "fileSize": 1024000,
  "fileMimeType": "application/pdf",
  "viewCount": 1
}
```

### Get Share Info
**GET** `/api/shares/info/:shareId`

Response:
```json
{
  "success": true,
  "shareId": "a1b2c3d4e5f6",
  "contentType": "file",
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "isPasswordProtected": true,
  "isOneTimeView": false,
  "viewCount": 1,
  "maxViewCount": null,
  "expiresAt": "2024-02-13T10:35:00Z"
}
```

### Delete Share
**DELETE** `/api/shares/delete/:shareId`

Response:
```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

### Health Check
**GET** `/api/health`

Response:
```json
{
  "status": "Backend is running"
}
```

## Database Schema

### Share Model

```javascript
{
  shareId: String (unique, indexed),
  contentType: String ("text" | "file"),
  textContent: String (for text shares),
  fileName: String (for file shares),
  fileUrl: String (base64-encoded file),
  fileSize: Number,
  fileMimeType: String,
  password: String (hashed if protected),
  isPasswordProtected: Boolean,
  isOneTimeView: Boolean,
  viewCount: Number,
  maxViewCount: Number,
  createdAt: Date,
  expiresAt: Date (indexed for TTL),
  isExpired: Boolean
}
```

## Design Decisions

1. **Base64 File Storage**: Files are stored as base64-encoded strings in MongoDB for simplicity. For production, consider using cloud storage (Firebase, AWS S3) with URLs stored in DB.

2. **TTL Index**: MongoDB TTL index automatically deletes documents after expiry time, eliminating need for separate cleanup service.

3. **Share ID Generation**: 12-character alphanumeric IDs generated from UUID provide strong uniqueness and security against brute force attempts.

4. **Password Hashing**: bcryptjs with salt rounds of 10 provides secure password storage.

5. **No Authentication Required**: Base implementation allows anonymous uploads and access per requirements.

6. **View Count Tracking**: Stored in DB to track views and enable one-time view feature.

7. **Client-side Routing**: Simple state-based routing without external routing library to keep dependencies minimal.

## Running in Production

1. **Build Frontend**
```bash
cd frontend
npm run build
```

2. **Set Production Environment Variables**
```bash
# Backend .env
NODE_ENV=production
MONGODB_URI=[production-mongodb-uri]
FRONTEND_URL=[production-frontend-url]
PORT=5000
```

3. **Run Backend**
```bash
cd backend
npm run start
```

4. **Serve Frontend** (using Nginx, Apache, or Node.js server)
- Serve the `frontend/dist` folder as static files

## Limitations & Considerations

1. **File Size**: Limited to 50MB per file (multer configuration)
2. **Storage**: Base64 encoding increases data size by ~33%
3. **Scalability**: For high traffic, implement distributed file storage
4. **Memory**: Large files stored in memory during upload (use streaming for production)
5. **Privacy**: No encryption at rest (implement for sensitive data)

## Future Enhancements

1. Use cloud storage (Firebase, AWS S3) instead of base64
2. Implement email notifications for share expiry
3. Add QR code generation for easy sharing
4. Implement rate limiting for uploads
5. Add metrics and analytics dashboard
6. Support for encrypted shares
7. Admin dashboard for monitoring

## License

MIT License

## Support

For issues or questions, please create an issue in the repository.
