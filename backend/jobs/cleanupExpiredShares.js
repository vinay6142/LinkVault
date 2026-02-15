import Share from '../models/Share.js';
import { deleteFileFromStorage } from '../utils/supabase.js';

/**
 * Cleanup job to delete expired shares and their files from Supabase Storage
 * This runs on a schedule to handle any files that weren't deleted during normal operations
 */
export const cleanupExpiredShares = async () => {
  try {
    console.log('[Cleanup Job] Starting cleanup of expired shares...');

    // Find all shares that have expired
    const expiredShares = await Share.find({
      expiresAt: { $lt: new Date() },
    });

    if (expiredShares.length === 0) {
      console.log('[Cleanup Job] No expired shares found');
      return;
    }

    console.log(`[Cleanup Job] Found ${expiredShares.length} expired shares to clean up`);

    let deletedCount = 0;
    let fileDeletedCount = 0;

    for (const share of expiredShares) {
      try {
        // Delete file from Supabase Storage if it's a file share
        if (share.contentType === 'file' && share.storagePath) {
          const deleteResult = await deleteFileFromStorage(share.storagePath);
          if (deleteResult.success) {
            fileDeletedCount++;
          } else {
            console.warn(`[Cleanup Job] Failed to delete file ${share.storagePath}:`, deleteResult.error);
          }
        }

        // Delete from MongoDB
        await Share.deleteOne({ _id: share._id });
        deletedCount++;
      } catch (error) {
        console.error(`[Cleanup Job] Error cleaning up share ${share.shareId}:`, error);
      }
    }

    console.log(
      `[Cleanup Job] Cleanup completed. Deleted ${deletedCount} shares and ${fileDeletedCount} files from storage`
    );
  } catch (error) {
    console.error('[Cleanup Job] Unexpected error during cleanup:', error);
  }
};

/**
 * Start the cleanup job with the given interval in milliseconds
 * Default: runs every 5 minutes
 */
export const startCleanupJob = (intervalMs = 5 * 60 * 1000) => {
  console.log(`[Cleanup Job] Scheduled cleanup job to run every ${intervalMs / 1000} seconds`);

  // Run immediately on startup
  cleanupExpiredShares();

  // Then run on the specified interval
  setInterval(cleanupExpiredShares, intervalMs);
};
