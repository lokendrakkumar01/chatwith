require('dotenv').config();
const { uploadMessageMedia } = require('./config/localStorage');
const fs = require('fs');

async function testUpload() {
      console.log('Testing file upload...');

      // Create a test buffer
      const testBuffer = Buffer.from('This is a test image file');

      try {
            const result = await uploadMessageMedia(testBuffer, 'image', 'test-image.jpg');
            console.log('✅ Upload successful!');
            console.log('Result:', result);

            // Check if file exists
            const filePath = `./public${result.url}`;
            if (fs.existsSync(filePath)) {
                  console.log('✅ File exists at:', filePath);
            } else {
                  console.log('❌ File NOT found at:', filePath);
            }
      } catch (error) {
            console.error('❌ Upload failed:', error);
      }
}

testUpload();
