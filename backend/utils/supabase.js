import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: Supabase credentials not configured');
}

// Client for frontend (with anon key) - used for operations from frontend
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (with service key) - used for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Verify JWT token from request header
export const verifyToken = async (token) => {
  try {
    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Get user profile from Supabase
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
};

// Create user profile
export const createUserProfile = async (userId, displayName = null) => {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .insert([
        {
          id: userId,
          display_name: displayName || 'Anonymous User',
          avatar_url: null,
          bio: null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId, displayName, avatarUrl, bio) => {
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .update({
        display_name: displayName,
        avatar_url: avatarUrl,
        bio: bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
};

// Upload file to Supabase Storage
export const uploadFileToStorage = async (fileBuffer, fileName, shareId) => {
  try {
    const bucketName = 'files';
    const filePath = `${shareId}/${fileName}`;

    let data, error;

    // Upload file to Supabase Storage with the service key (admin access)
    if (supabaseServiceKey) {
      // Use admin client for reliable uploads
      const result = await supabaseAdmin.storage.from(bucketName).upload(filePath, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: false,
      });
      data = result.data;
      error = result.error;
    } else {
      // Fallback to regular client if service key not available
      const result = await supabaseClient.storage.from(bucketName).upload(filePath, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: false,
      });
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, filePath: data.path };
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    return { success: false, error: error.message };
  }
};

// Get signed URL for file download (with expiry)
export const getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    const bucketName = 'files';
    let data, error;

    if (supabaseServiceKey) {
      const result = await supabaseAdmin.storage.from(bucketName).createSignedUrl(filePath, expiresIn);
      data = result.data;
      error = result.error;
    } else {
      const result = await supabaseClient.storage.from(bucketName).createSignedUrl(filePath, expiresIn);
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Signed URL error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, signedUrl: data?.signedUrl };
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return { success: false, error: error.message };
  }
};

// Delete file from Supabase Storage
export const deleteFileFromStorage = async (filePath) => {
  try {
    const bucketName = 'files';
    let data, error;

    if (supabaseServiceKey) {
      const result = await supabaseAdmin.storage.from(bucketName).remove([filePath]);
      data = result.data;
      error = result.error;
    } else {
      const result = await supabaseClient.storage.from(bucketName).remove([filePath]);
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    return { success: false, error: error.message };
  }
};

// Get public URL for file (no expiry, but RLS policies should protect it)
export const getPublicUrl = (filePath) => {
  try {
    const bucketName = 'files';
    const { data } = supabaseClient.storage.from(bucketName).getPublicUrl(filePath);

    if (!data?.publicUrl) {
      return { success: false, error: 'Could not generate public URL' };
    }

    return { success: true, publicUrl: data.publicUrl };
  } catch (error) {
    console.error('Error getting public URL:', error);
    return { success: false, error: error.message };
  }
};

export default supabaseClient;
