import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUserProfile, createUserProfile } from '../utils/supabase.js';

const router = express.Router();

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Check if profile exists
    let profile = await getUserProfile(userId);

    // If profile doesn't exist, create one
    if (!profile) {
      profile = await createUserProfile(userId, req.user.user_metadata?.name || 'User');

      if (!profile) {
        return res.status(500).json({ error: 'Failed to create user profile' });
      }
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        profile: profile,
      },
    });
  } catch (error) {
    console.error('Error in /me endpoint:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Health check for auth
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Auth service is running' });
});

export default router;
