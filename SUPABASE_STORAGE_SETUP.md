# Supabase Storage Setup Guide

## Overview
LinkVault now uses Supabase Storage (Object Storage) to store uploaded files instead of storing them as base64 in MongoDB. This provides better scalability, performance, and cost efficiency.

## Prerequisites
- Active Supabase project
- Supabase URL and API keys (already configured in `.env`)

## Setup Instructions

### 1. Create Storage Bucket in Supabase

Go to your Supabase dashboard → **Storage** section:

1. Click **Create new bucket**
2. Name: `files`
3. Make **Public** (for downloadable files OR use signed URLs for extra security)
4. Click **Create**

### 2. Configure RLS (Row Level Security) Policies

For public access without authentication:

```sql
-- Allow public read access to all files
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'files');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'files' AND
  auth.role() = 'authenticated'
);

-- Allow deletion of own files
CREATE POLICY "Allow deletion"
ON storage.objects
FOR DELETE
USING (bucket_id = 'files');
```

Or use Supabase dashboard:
- Go to Storage → Policies
- Add policy to allow public reads (if using public URLs)
- Add policy for authenticated uploads

### 3. Environment Variables

Make sure your `.env` file has:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

**Note:** The service key (with admin privileges) is used for file operations. Keep it secret!

### 4. Bucket Structure

Files are organized in the bucket as:
```
files/
├── shareId1/
│   ├── document.pdf
│   └── image.jpg
├── shareId2/
│   └── archive.zip
```

This structure groups files by their share ID for easy management.

## How It Works

### File Upload Flow
```
1. User selects file
2. Backend receives file upload
3. File is uploaded to Supabase Storage → files/shareId/filename
4. Signed URL generated for secure access
5. Only metadata + signed URL stored in MongoDB
6. Response sent to user
```

### File Download Flow
```
1. User clicks download
2. Frontend gets signed URL from database
3. Browser downloads directly from Supabase (CDN)
4. View count incremented in DB
```

### File Deletion Flow
```
1. Share expires OR user manually deletes
2. Backend deletes from Supabase Storage
3. Backend deletes metadata from MongoDB
4. Cleanup job runs periodically to catch missed deletions
```

## Features

### Automatic Cleanup
- **Cleanup Job** runs every 5 minutes
- Finds expired shares (expiresAt < now)
- Deletes files from Supabase Storage
- Deletes records from MongoDB
- Safe: Non-blocking, logs warnings if deletion fails

### Signed URLs
- URLs expire after 1 hour by default
- Provides pseudo-security without authentication
- Can be regenerated if needed

### File Organization
- Files grouped by shareId
- Easy to identify and manage
- Safe deletion without impacting other shares

## Benefits

| Aspect | Before (Base64) | After (Supabase) |
|--------|-----------------|-----------------|
| **Database Size** | Large (33% overhead) | Small (metadata only) |
| **Memory Usage** | High (loads full file) | Low (only metadata) |
| **Download Speed** | Database dependent | CDN optimized |
| **Scalability** | Limited (~1GB max) | Unlimited |
| **Cost** | Database storage | Pay-per-GB storage |
| **Performance** | Slower | Much faster |

## Troubleshooting

### "Failed to upload file to storage"
- Check Supabase service key is set
- Verify bucket name is `files`
- Check bucket RLS policies

### "Files not being deleted"
- Cleanup job logs to console
- Check MongoDB TTL index is working
- Manual cleanup: `DELETE FROM shares WHERE expiresAt < now()`

### Signed URLs expiring too quickly
- Increase `expiresIn` parameter in `getSignedUrl()` (in seconds)
- Or regenerate URL when needed

## Performance Optimization

For even better performance in production:

1. **Enable CDN** in Supabase Storage settings
2. **Set appropriate cache headers** for files
3. **Monitor storage usage** in Supabase dashboard
4. **Set auto-delete policy** if needed (can be done via RLS)

## Cost Estimation

Supabase Storage is very affordable:
- First 1GB free
- Then $0.075 per GB/month
- Egress bandwidth: $0.09/GB (first 100GB free)

Example: 100 files × 10MB each:
- Storage: $0.075/month (very cheap!)
- Much cheaper than MongoDB storage

## Next Steps

1. Create the `files` bucket in Supabase
2. Configure RLS policies
3. Start the backend server
4. Upload a test file to verify it works
5. Check Supabase Storage → Files to see uploaded files

---

For more info: https://supabase.com/docs/guides/storage
