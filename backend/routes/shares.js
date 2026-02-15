import express from 'express';
import multer from 'multer';
import Share from '../models/Share.js';
import { generateShareId, hashPassword, comparePassword, calculateExpiryTime, validateExpiryDateTime, validateExpiryMinutes } from '../utils/helpers.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';
import { uploadFileToStorage, deleteFileFromStorage, getSignedUrl } from '../utils/supabase.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Upload text or file
router.post('/upload', optionalAuthMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { text, password, isOneTimeView, expiryMinutes, expiryDateTime, maxViewCount } = req.body;
    const file = req.file;

    console.log('Upload request - maxViewCount:', maxViewCount, 'type:', typeof maxViewCount);

    // Validation: Either text or file must be provided
    if (!text && !file) {
      return res.status(400).json({ error: 'Either text or file must be provided' });
    }

    // Validation: Cannot have both text and file
    if (text && file) {
      return res.status(400).json({ error: 'Cannot upload both text and file. Choose one.' });
    }

    const shareId = generateShareId();

    // Calculate expiry time based on what was provided
    let expiresAt;
    if (expiryDateTime) {
      // Validate the provided date and time
      const validation = validateExpiryDateTime(expiryDateTime);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      expiresAt = new Date(expiryDateTime);
    } else if (expiryMinutes) {
      // Validate the provided minutes
      const validation = validateExpiryMinutes(expiryMinutes);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
      expiresAt = calculateExpiryTime(parseInt(expiryMinutes));
    } else {
      // Use default: 10 minutes
      expiresAt = calculateExpiryTime(null);
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await hashPassword(password);
    }

    const parsedMaxViewCount = maxViewCount ? parseInt(maxViewCount) : null;
    console.log('Parsed maxViewCount:', parsedMaxViewCount);

    let shareData = {
      shareId,
      expiresAt,
      isPasswordProtected: !!password,
      password: hashedPassword,
      isOneTimeView: isOneTimeView === 'true' || isOneTimeView === true,
      userId: req.userId || null, // Add userId if user is authenticated
      maxViewCount: parsedMaxViewCount,
    };

    if (text) {
      shareData.contentType = 'text';
      shareData.textContent = text;
    } else if (file) {
      // Upload file to Supabase Storage
      const storageResult = await uploadFileToStorage(file.buffer, file.originalname, shareId);

      if (!storageResult.success) {
        return res.status(500).json({ error: 'Failed to upload file to storage: ' + storageResult.error });
      }

      // Generate signed URL for the file (expires in 1 hour by default, but we'll validate against share expiry)
      const signedUrlResult = await getSignedUrl(storageResult.filePath, 3600);

      if (!signedUrlResult.success) {
        // If signed URL fails, still store the path - we can retry later
        console.warn('Warning: Could not generate signed URL for file:', storageResult.filePath);
      }

      shareData.contentType = 'file';
      shareData.fileName = file.originalname;
      shareData.storagePath = storageResult.filePath;
      shareData.fileUrl = signedUrlResult.success ? signedUrlResult.signedUrl : null;
      shareData.fileSize = file.size;
      shareData.fileMimeType = file.mimetype;
    }

    const share = new Share(shareData);
    await share.save();

    res.status(201).json({
      success: true,
      shareId,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${shareId}`,
      expiresAt,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload content' });
  }
});

// Retrieve content by share ID
router.post('/view/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { password } = req.body;

    const share = await Share.findOne({ shareId });

    if (!share) {
      return res.status(404).json({ error: 'Content not found or has expired' });
    }

    console.log('View request - shareId:', shareId);
    console.log('Current viewCount:', share.viewCount, 'maxViewCount:', share.maxViewCount);

    // Check if expired
    if (new Date() > share.expiresAt) {
      // Delete file from Supabase Storage if it exists
      if (share.contentType === 'file' && share.storagePath) {
        await deleteFileFromStorage(share.storagePath).catch((err) => {
          console.warn('Failed to delete expired file from storage:', err);
        });
      }
      await Share.deleteOne({ shareId });
      return res.status(404).json({ error: 'Content has expired' });
    }

    // Check password if protected
    if (share.isPasswordProtected) {
      if (!password) {
        return res.status(403).json({ error: 'Password required' });
      }
      const isPasswordValid = await comparePassword(password, share.password);
      if (!isPasswordValid) {
        return res.status(403).json({ error: 'Invalid password' });
      }
    }

    // Check one-time view
    if (share.isOneTimeView && share.viewCount > 0) {
      return res.status(403).json({ error: 'This link can only be viewed once' });
    }

    // Check max view count BEFORE incrementing
    if (share.maxViewCount && share.viewCount >= share.maxViewCount) {
      console.log(`Max view count reached: ${share.viewCount} >= ${share.maxViewCount}`);
      return res.status(403).json({ error: 'Maximum view count reached' });
    }

    console.log('Incrementing view count...');

    // Increment view count atomically and get updated document
    const updatedShare = await Share.findOneAndUpdate(
      { shareId: shareId },
      {
        $inc: { viewCount: 1 },
        isExpired: share.isOneTimeView ? true : share.isExpired
      },
      { new: true }
    );

    // If one-time view, delete immediately after sending response
    if (share.isOneTimeView) {
      setTimeout(async () => {
        // Delete file from Supabase Storage if it's a file share
        if (share.contentType === 'file' && share.storagePath) {
          await deleteFileFromStorage(share.storagePath).catch((err) => {
            console.warn('Failed to delete one-time view file from storage:', err);
          });
        }
        await Share.deleteOne({ shareId });
      }, 100);
    }

    if (share.contentType === 'text') {
      return res.json({
        success: true,
        contentType: 'text',
        content: share.textContent,
        viewCount: updatedShare.viewCount,
      });
    } else {
      let fileUrl = share.fileUrl;

      // If fileUrl is missing (failed during upload), regenerate signed URL
      if (!fileUrl && share.storagePath) {
        console.log('Regenerating signed URL for:', share.storagePath);
        const signedUrlResult = await getSignedUrl(share.storagePath, 3600);
        if (signedUrlResult.success) {
          fileUrl = signedUrlResult.signedUrl;
          // Update the database with the new URL
          await Share.updateOne({ shareId }, { fileUrl });
        } else {
          console.warn('Failed to regenerate signed URL:', signedUrlResult.error);
        }
      }

      return res.json({
        success: true,
        contentType: 'file',
        fileName: share.fileName,
        fileUrl: fileUrl,
        fileSize: share.fileSize,
        fileMimeType: share.fileMimeType,
        viewCount: updatedShare.viewCount,
      });
    }
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
});

// Delete share manually
router.delete('/delete/:shareId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await Share.findOne({ shareId });

    if (!share) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // If user is authenticated, check if they own the share
    if (req.userId) {
      if (share.userId !== req.userId) {
        return res.status(403).json({ error: 'You do not have permission to delete this share' });
      }
    }

    // Delete file from Supabase Storage if it's a file share
    if (share.contentType === 'file' && share.storagePath) {
      const deleteResult = await deleteFileFromStorage(share.storagePath);
      if (!deleteResult.success) {
        console.warn('Warning: Failed to delete file from storage:', deleteResult.error);
        // Continue anyway - delete from DB
      }
    }

    const result = await Share.deleteOne({ shareId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Get user's shares (dashboard) - requires authentication
router.get('/user-shares', optionalAuthMiddleware, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required to view your shares' });
    }

    // Find all shares for this user
    const shares = await Share.find(
      { userId: req.userId },
      { textContent: 0, fileUrl: 0, password: 0 } // Don't return sensitive data
    ).sort({ createdAt: -1 });

    res.json({
      success: true,
      shares: shares,
      count: shares.length,
    });
  } catch (error) {
    console.error('Get user shares error:', error);
    res.status(500).json({ error: 'Failed to retrieve user shares' });
  }
});

// Check share info (without returning actual content)
router.get('/info/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;

    const share = await Share.findOne({ shareId }, { textContent: 0, fileUrl: 0 });

    if (!share) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (new Date() > share.expiresAt) {
      // Delete file from Supabase Storage if it exists
      if (share.contentType === 'file' && share.storagePath) {
        await deleteFileFromStorage(share.storagePath).catch((err) => {
          console.warn('Failed to delete expired file from storage:', err);
        });
      }
      await Share.deleteOne({ shareId });
      return res.status(404).json({ error: 'Content has expired' });
    }

    res.json({
      success: true,
      shareId,
      contentType: share.contentType,
      fileName: share.fileName,
      fileSize: share.fileSize,
      isPasswordProtected: share.isPasswordProtected,
      isOneTimeView: share.isOneTimeView,
      viewCount: share.viewCount,
      maxViewCount: share.maxViewCount,
      expiresAt: share.expiresAt,
    });
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({ error: 'Failed to retrieve info' });
  }
});

export default router;
