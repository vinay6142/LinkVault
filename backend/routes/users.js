import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUserProfile, updateUserProfile } from '../utils/supabase.js';

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await getUserProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      success: true,
      profile: profile,
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { display_name, avatar_url, bio } = req.body;

    // Validate input
    if (!display_name || display_name.trim() === '') {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const profile = await updateUserProfile(userId, display_name, avatar_url, bio);

    if (!profile) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({
      success: true,
      profile: profile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
