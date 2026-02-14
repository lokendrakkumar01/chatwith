const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {String} folder - Cloudinary folder name
 * @param {String} resourceType - 'image', 'video', 'raw', 'auto'
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'chatwith', resourceType = 'auto') => {
      return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                  {
                        folder: folder,
                        resource_type: resourceType,
                        transformation: resourceType === 'image' ? [
                              { width: 800, height: 800, crop: 'limit', quality: 'auto' }
                        ] : undefined
                  },
                  (error, result) => {
                        if (error) {
                              reject(error);
                        } else {
                              resolve(result);
                        }
                  }
            );

            streamifier.createReadStream(buffer).pipe(uploadStream);
      });
};

/**
 * Upload profile image to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<String>} Cloudinary  secure URL
 */
const uploadProfileImage = async (buffer) => {
      const result = await uploadToCloudinary(buffer, 'chatwith/profiles', 'image');
      return result.secure_url;
};

/**
 * Upload message media to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {String} resourceType - 'image', 'video', 'raw'
 * @returns {Promise<Object>} { url, type, publicId }
 */
const uploadMessageMedia = async (buffer, resourceType = 'auto') => {
      const result = await uploadToCloudinary(buffer, 'chatwith/messages', resourceType);
      return {
            url: result.secure_url,
            type: result.resource_type,
            publicId: result.public_id,
            format: result.format
      };
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @param {String} resourceType - 'image', 'video', 'raw'
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
      return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = {
      uploadProfileImage,
      uploadMessageMedia,
      deleteFromCloudinary,
      cloudinary
};
