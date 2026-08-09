const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const cloudName = 'vzq8p7ot';
const apiKey = '361676817915771';
const apiSecret = 'HdLS3Zkb971WfCXlIPOBuB54_fE';
const folder = 'test-uploads';

async function testUpload() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Sorted parameters to sign: folder, timestamp
  const paramString = `folder=${folder}&timestamp=${timestamp}`;
  const stringToSign = `${paramString}${apiSecret}`;
  
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  console.log('Timestamp:', timestamp);
  console.log('ParamString:', paramString);
  console.log('StringToSign:', stringToSign);
  console.log('Signature:', signature);

  // Create dummy image (1x1 GIF)
  const dummyBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  
  const formData = new FormData();
  const blob = new Blob([dummyBuffer], { type: 'image/gif' });
  formData.append('file', blob, 'test.gif');
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('signature', signature);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const status = res.status;
    const text = await res.text();
    console.log('Cloudinary HTTP Status:', status);
    console.log('Cloudinary Response:', text);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testUpload();
