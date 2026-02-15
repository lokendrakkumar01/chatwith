const fs = require('fs');
const path = require('path');

/**
 * Local file storage fallback when Cloudinary is not available
 */

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const messagesDir = path.join(uploadsDir, 'messages');

// Create directories if they don't exist
[uploadsDir, profilesDir, messagesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
      }
});

/**
 * Save file buffer to local storage
 * @param {Buffer} buffer - File buffer
 * @param {String} folder - 'profiles' or 'messages'
 * @param {String} originalName - Original filename
 * @returns {Promise<String>} Public URL to the file
 */
const saveFileLocally = async (buffer, folder, originalName) => {
      try {
            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const ext = path.extname(originalName);
            const filename = `${timestamp}-${randomString}${ext}`;

            // Determine directory
            const targetDir = folder === 'profiles' ? profilesDir : messagesDir;
            const filePath = path.join(targetDir, filename);

            // Write file
            await fs.promises.writeFile(filePath, buffer);

            // Return public URL
            const publicUrl = `/uploads/${folder}/${filename}`;
            return publicUrl;
      } catch (error) {
            console.error('Local file save error:', error);
            throw new Error('Failed to save file locally');
      }
};

/**
 * Upload profile image (local storage)
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<String>} Public URL
 */
const uploadProfileImage = async (buffer) => {
      return await saveFileLocally(buffer, 'profiles', 'profile.jpg');
};

/**
 * Upload message media (local storage)
 * @param {Buffer} buffer - File buffer
 * @param {String} resourceType - 'image', 'video', 'raw'
 * @param {String} originalName - Original filename
 * @returns {Promise<Object>} { url, type }
 */
const uploadMessageMedia = async (buffer, resourceType = 'auto', originalName = 'file') => {
      const url = await saveFileLocally(buffer, 'messages', originalName);
      return {
            url: url,
            type: resourceType,
            publicId: null,
            format: path.extname(originalName).substring(1)
      };
};

/**
 * Delete file from local storage
 * @param {String} publicUrl - Public URL of the file
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromLocal = async (publicUrl) => {
      try {
            const filePath = path.join(__dirname, '../public', publicUrl);
            if (fs.existsSync(filePath)) {
                  await fs.promises.unlink(filePath);
                  return { result: 'ok' };
            }
            return { result: 'not found' };
      } catch (error) {
            console.error('Delete file error:', error);
            throw error;
      }
};

module.exports = {
      uploadProfileImage,
      uploadMessageMedia,
      deleteFromLocal
};
