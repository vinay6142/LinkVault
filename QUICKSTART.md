# Quick Start Guide

## Get Up and Running in 5 Minutes

### Option 1: With Docker (Easiest)

```bash
# Clone or navigate to project
cd LinkVault

# Start everything
docker-compose up -d

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Option 2: Manual Setup (Development)

#### Terminal 1 - MongoDB
```bash
# Install MongoDB or use MongoDB Atlas
# If local: mongod
```

#### Terminal 2 - Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start backend
npm run dev

# Runs on http://localhost:5000
```

#### Terminal 3 - Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start frontend
npm run dev

# Runs on http://localhost:5173
```

## First Test

1. Go to http://localhost:5173
2. Upload some text or a file
3. Copy the share link
4. Open it in a new tab or share with someone
5. View the content you shared

## Project Structure

```
LinkVault/
├── backend/                    # Express.js backend
│   ├── models/
│   │   └── Share.js           # MongoDB schema
│   ├── routes/
│   │   └── shares.js          # API endpoints
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── utils/
│   │   └── helpers.js         # Utilities
│   ├── server.js              # Main server file
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx   # Upload page
│   │   │   └── SharePage.jsx  # View page
│   │   ├── components/
│   │   │   ├── Navigation.jsx
│   │   │   ├── UploadForm.jsx
│   │   │   ├── SuccessModal.jsx
│   │   │   ├── PasswordPrompt.jsx
│   │   │   ├── TextDisplay.jsx
│   │   │   └── FileDisplay.jsx
│   │   ├── App.jsx
│   │   ├── api.js             # API client
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── nginx.conf
│   ├── package.json
│   ├── .env.example
│   └── Dockerfile
│
├── README.md                   # Main documentation
├── DEPLOYMENT.md              # Deployment guide
├── ARCHITECTURE.md            # Architecture & design
├── docker-compose.yml         # Docker compose setup
└── .gitignore

```

## Key Features

✅ Share text with copy-to-clipboard
✅ Upload files up to 50MB
✅ Unique shareable links
✅ Automatic 10-min expiry
✅ Optional password protection
✅ One-time view option
✅ View count tracking
✅ Dark mode support
✅ Clean, modern UI
✅ Fully responsive

## Environment Variables

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/linkvault
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:5000/api
```

## Common Commands

### Backend
```bash
npm install       # Install dependencies
npm run dev       # Start with auto-reload
npm start         # Start production
npm test          # Run tests (if configured)
```

### Frontend
```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Docker
```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
docker-compose down -v        # Remove data volumes
```

## Troubleshooting

### Port Already in Use
```bash
# Find the process
lsof -i :5000
lsof -i :5173

# Kill it
kill -9 <PID>
```

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
# For local: mongod should be running
# For cloud: Check connection string in .env
```

### CORS Error
- Make sure backend is running on http://localhost:5000
- Check FRONTEND_URL in backend .env
- Ensure frontend API URL is correct

### File Upload Fails
- Check file size (max 50MB)
- Ensure backend is running
- Check browser console for errors

## Next Steps

1. Customize the UI in `frontend/src/components`
2. Add authentication in `backend/routes/shares.js`
3. Implement cloud storage in `backend/routes/shares.js`
4. Deploy using the DEPLOYMENT.md guide
5. Set up monitoring and logging

## Support

Refer to detailed documentation:
- `README.md` - Full documentation
- `DEPLOYMENT.md` - Deployment options
- `ARCHITECTURE.md` - System design and data flow

Happy sharing! 🚀
