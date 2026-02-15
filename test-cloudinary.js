require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'Not Set');

// Test with a simple upload
const testBuffer = Buffer.from('test');
const streamifier = require('streamifier');

console.log('\nAttempting test upload...');

const uploadStream = cloudinary.uploader.upload_stream(
      {
            folder: 'chatwith/test',
            resource_type: 'raw'
      },
      (error, result) => {
            if (error) {
                  console.error('\n❌ Upload failed!');
                  console.error('Error details:', JSON.stringify(error, null, 2));
            } else {
                  console.log('\n✅ Upload successful!');
                  console.log('Result:', result);
            }
      }
);

streamifier.createReadStream(testBuffer).pipe(uploadStream);
