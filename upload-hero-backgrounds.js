const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const CLOUD_NAME = 'dgdl1vdao';
const API_KEY = '171854163913986';
const API_SECRET = 'e5rqAhSKqCGTgkieBSPmdmWvcNo';

const files = [
  'C:\\Users\\PC\\Downloads\\temp\\1.webp',
  'C:\\Users\\PC\\Downloads\\temp\\2.webp',
  'C:\\Users\\PC\\Downloads\\temp\\3.webp',
  'C:\\Users\\PC\\Downloads\\temp\\4.webp',
  'C:\\Users\\PC\\Downloads\\temp\\5.webp',
  'C:\\Users\\PC\\Downloads\\temp\\6.webp',
  'C:\\Users\\PC\\Downloads\\temp\\7.webp',
];

function generateSignature(params, apiSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return crypto
    .createHash('sha256')
    .update(sortedParams + apiSecret)
    .digest('hex');
}

async function uploadToCloudinary(filePath) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      resolve(null);
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const base64Image = `data:image/webp;base64,${fileBuffer.toString('base64')}`;

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'vadiler/hero-backgrounds';
    const publicId = filename.replace('.webp', '');
    
    const signatureParams = {
      timestamp,
      folder,
      public_id: publicId,
    };
    
    const signature = generateSignature(signatureParams, API_SECRET);

    const postData = JSON.stringify({
      file: base64Image,
      folder,
      public_id: publicId,
      timestamp,
      api_key: API_KEY,
      signature,
    });

    const options = {
      hostname: 'api.cloudinary.com',
      port: 443,
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.secure_url) {
            console.log(`✅ Uploaded: ${filename}`);
            console.log(`   URL: ${response.secure_url}`);
            resolve(response.secure_url);
          } else {
            console.log(`❌ Failed: ${filename}`, response.error || response);
            resolve(null);
          }
        } catch (error) {
          console.log(`❌ Parse error for ${filename}:`, error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Upload error for ${filename}:`, error.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Starting upload to Cloudinary...\n');

  const uploadedUrls = [];

  for (const file of files) {
    const url = await uploadToCloudinary(file);
    if (url) {
      uploadedUrls.push(url);
    }
    // Small delay between uploads
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n📋 Uploaded URLs:');
  console.log('================');
  uploadedUrls.forEach((url, i) => {
    console.log(`${i + 1}. ${url}`);
  });
  console.log('\n✨ Upload completed!');
}

main().catch(console.error);
