# File Download Fix - Troubleshooting Guide

## What Was The Problem?

Frontend was trying to decode file URLs as **base64 strings** (old approach), but after switching to Supabase Storage, the backend now returns **signed URLs** (not base64).

**Old:** `fileUrl = "iVBORw0KGgoAAAANS...huge base64 string..."`
**New:** `fileUrl = "https://xxx.supabase.co/storage/v1/object/sign/files/...?token=..."`

Frontend didn't know how to handle the new URL format → Download failed ❌

---

## What Was Fixed?

### ✅ Frontend Changes
1. **SharePage.jsx** - Removed base64 decoding logic
2. **FileDisplay.jsx** - Updated to fetch from signed URL instead of creating blob from base64
3. Added loading state "Downloading..." while fetching

### ✅ Backend Changes
1. **shares.js view endpoint** - Now regenerates signed URL if it's missing/null
2. Fallback: If signed URL wasn't generated during upload, it will be generated on first view

---

## Testing Steps

### Step 1: Clear Cache & Restart

```bash
# Stop backend
npm stop

# Stop frontend (if running separately)
# In another terminal, stop vite/npm run dev

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart backend
npm start

# Restart frontend: npm run dev
```

### Step 2: Test File Upload & Download

1. Go to app homepage
2. Upload a test file (small file like 1MB for testing)
3. You should see success message with share link
4. Open the share link
5. Click **Download File**
6. File should download ✅

### Step 3: Check Browser Console

If download fails:

1. Open browser **Developer Tools** (F12)
2. Go to **Console** tab
3. Try download again
4. Look for error messages

**Common errors:**

```
Failed to download file (HTTP 404)
→ Problem: File not in Supabase storage or path is wrong

Failed to download file (HTTP 403)
→ Problem: Supabase bucket permissions issue

CORS error
→ Problem: Supabase CORS settings need update

Network error
→ Problem: Supabase credentials invalid
```

### Step 4: Check Backend Logs

In terminal where backend is running, look for:

```
Regenerating signed URL for: shareId/filename.ext
→ Good: Means it's regenerating URL (will work now)

Storage upload error
→ Problem: File didn't upload to Supabase

Failed to regenerate signed URL
→ Problem: Supabase service key issue
```

---

## Common Issues & Solutions

### Issue 1: "Failed to download file" Alert

**Cause:** fileUrl is null or response failed

**Fix:**
1. Check Supabase bucket `files` exists
2. Check SUPABASE_SERVICE_KEY is set correctly
3. Check file actually appears in Supabase dashboard under Storage → files
4. Restart backend

```bash
# Verify credentials
echo $SUPABASE_SERVICE_KEY
# Should show a long key, not empty
```

### Issue 2: Download starts but stops

**Cause:** Signed URL expired (default 1 hour)

**Fix:** If URL is very old, regenerate:
- View the link again → URL gets regenerated
- Downloads should work

### Issue 3: Browser shows "Network Error"

**Cause:** CORS issue with Supabase

**Fix:**
1. Go to Supabase dashboard
2. Storage → Settings
3. Check CORS settings
4. Might need to update if your frontend domain is different

---

## Architecture Fix Explained

### Before (Broken with new code)
```javascript
// Backend returns:
{ fileUrl: "https://xxx.supabase.co/storage/v1/object/..." }

// Frontend tried:
const binaryString = atob(fileUrl);  // FAIL! ❌
// Can't decode URL as base64!
```

### After (Now working)
```javascript
// Backend returns:
{ fileUrl: "https://xxx.supabase.co/storage/v1/object/..." }

// Frontend now does:
const response = await fetch(fileUrl);  // ✅ Works!
const blob = await response.blob();     // ✅ Works!
// Download file properly
```

---

## Verification Checklist

Before assuming it's working:

- [ ] Upload file through web app
- [ ] See success message
- [ ] Click "Download File" button
- [ ] File actually downloads to computer
- [ ] File content is correct (not corrupted)
- [ ] Try with different file types (PDF, image, zip, etc.)
- [ ] Try password-protected share
- [ ] Try one-time view link
- [ ] Check browser console for errors

---

## Files Modified

```
frontend/src/pages/SharePage.jsx
  → Removed base64 decoding logic

frontend/src/components/FileDisplay.jsx
  → Updated download handler to use signed URLs
  → Added loading state

backend/routes/shares.js
  → Added URL regeneration logic
  → Fallback for missing fileUrl
```

---

## If Still Having Issues

Enable debug logging to understand what's happening:

### In browser console:
```javascript
// Set to verbose mode
localStorage.debug = '*';
```

### In backend server logs:
```bash
# Should see:
# "Regenerating signed URL for: shareId/filename"
# OR
# "Upload file to Supabase" success messages
```

---

## Quick Test Command

Quick test to verify Supabase is working:

```bash
# Test Supabase connection
node -e "
const { supabaseAdmin } = require('./backend/utils/supabase.js');
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_KEY);
"
```

---

## Expected Behavior After Fix

✅ Upload file → URL in database → View shared link → Click download → File downloads

✅ All file types work (PDF, images, zips, docs, etc.)

✅ Large files (up to 50MB) work fine

✅ Multiple downloads of same file work

✅ Expiry still works (file auto-deletes after expiry)

✅ One-time view still works (file deletes after view)

---

## Summary

The issue was a mismatch between old code (expecting base64) and new code (sending signed URLs). All fixes have been applied:

1. ✅ Frontend properly handles signed URLs
2. ✅ Backend regenerates URLs if missing
3. ✅ Error messages are more helpful
4. ✅ Loading state added

**Now test it and report any remaining errors!** 🚀

---

## Still Not Working?

If downloads still fail after trying these steps:

1. Check backend logs for error messages
2. Check Supabase dashboard → Storage → `files` bucket exists
3. Verify SUPABASE_SERVICE_KEY env variable is set
4. Try uploading a new file (old uploads might have null URL)
5. Check browser console for specific error messages

Then share the error messages and I can help debug further!
