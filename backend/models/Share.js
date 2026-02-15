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
