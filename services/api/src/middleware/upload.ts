import multer from 'multer';
import { AppError } from '../utils/errors';

/**
 * Multer Memory Storage Configuration
 * Files are kept in memory as Buffers for direct streaming to Dropbox.
 */
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit to accommodate short talent videos
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only images (JPEG, PNG, WEBP) and videos (MP4, MPEG, MOV) are allowed', 400) as any, false);
    }
  },
});
