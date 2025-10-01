// scripts/testIndexNow.js
// Test script to verify IndexNow submission works correctly
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://dataengineerhub.blog';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`\n📡 Response Status: ${res.statusCode}`);
        console.log('📋 Response Headers:', JSON.stringify(res.headers, null, 2));
        console.log('📄 Response Body:', data || '(empty)');
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    if (options.body) {
      console.log('📤 Request Body:');
      console.log(options.body);
      req.write(options.body);
    }

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function verifyKeyFiles(apiKey) {
  console.log('\n🔐 Verifying Key Files...');
  console.log('='.repeat(60));
  
  try {
    // Check indexnow-key.txt
    console.log('\n1️⃣ Checking indexnow-key.txt...');
    const keyUrl = `${SITE_URL}/indexnow-key.txt`;
    const keyResponse = await makeRequest(keyUrl);
    console.log(`✅ Status: ${keyResponse.status}`);
    console.log(`✅ Content: ${keyResponse.data.trim()}`);
    console.log(`✅ Match: ${keyResponse.data.trim() === apiKey ? 'YES' : 'NO'}`);
    
    // Check verification file
    console.log(`\n2️⃣ Checking ${apiKey}.txt...`);
    const verifyUrl = `${SITE_URL}/${apiKey}.txt`;
    const verifyResponse = await makeRequest(verifyUrl);
    console.log(`✅ Status: ${verifyResponse.status}`);
    console.log(`✅ Content: ${verifyResponse.data.trim()}`);
    console.log(`✅ Match: ${verifyResponse.data.trim() === apiKey ? 'YES' : 'NO'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function testIndexNowSubmission(endpoint) {
  console.log('\n📡 Testing IndexNow Submission');
  console.log('='.repeat(60));
  console.log(`Endpoint: ${endpoint}`);
  
  const keyFile = path.join(__dirname, '..', 'public', 'indexnow-key.txt');
  
  if (!fs.existsSync(keyFile)) {
    console.error('❌ indexnow-key.txt not found!');
    console.error('Run: node scripts/generateIndexNowKey.js');
    return false;
  }
  
  const apiKey = fs.readFileSync(keyFile, 'utf8').trim();
  console.log(`\n🔑 API Key: ${apiKey}`);
  
  // First verify key files are accessible
  const keyFilesOk = await verifyKeyFiles(apiKey);
  if (!keyFilesOk) {
    console.error('\n❌ Key files are not accessible. Deploy them first!');
    return false;
  }
  
  const urlObj = new URL(SITE_URL);
  const host = urlObj.hostname; // NO https://
  
  const payload = {
    host: host,
    key: apiKey,
    keyLocation: `${SITE_URL}/${apiKey}.txt`,
    urlList: [
      `${SITE_URL}/`,
      `${SITE_URL}/articles`
    ]
  };

  console.log('\n📦 Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  const jsonPayload = JSON.stringify(payload);
  const contentLength = Buffer.byteLength(jsonPayload);
  
  console.log(`\n📏 Payload size: ${contentLength} bytes`);
  
  try {
    const response = await makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': contentLength.toString(),
        'User-Agent': 'DataEngineerHub-IndexNow-Test/1.0'
      },
      body: jsonPayload
    });
    
    console.log('\n✅ SUCCESS!');
    console.log('='.repeat(60));
    
    // Interpret status codes
    if (response.status === 200) {
      console.log('✅ HTTP 200: URLs submitted successfully');
    } else if (response.status === 202) {
      console.log('✅ HTTP 202: Request accepted, will be processed');
    }
    
    return true;
  } catch (error) {
    console.log('\n❌ FAILED!');
    console.log('='.repeat(60));
    console.error('Error:', error.message);
    
    // Common error interpretations
    if (error.message.includes('403')) {
      console.error('\n💡 HTTP 403: Key verification failed');
      console.error('   - Check that key files are deployed correctly');
      console.error('   - Verify keyLocation URL is accessible');
    } else if (error.message.includes('400')) {
      console.error('\n💡 HTTP 400: Invalid request format');
      console.error('   - Check payload structure');
      console.error('   - Ensure host does not include https://');
    } else if (error.message.includes('422')) {
      console.error('\n💡 HTTP 422: Unprocessable entity');
      console.error('   - URLs might not match host');
      console.error('   - Check URL format');
    }
    
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 IndexNow Test Suite');
  console.log('='.repeat(60));
  console.log(`Site: ${SITE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);
  
  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow'
  ];
  
  for (const endpoint of endpoints) {
    const success = await testIndexNowSubmission(endpoint);
    
    if (success) {
      console.log(`\n✅ ${endpoint} works!`);
      break; // If one works, that's enough
    } else {
      console.log(`\n❌ ${endpoint} failed, trying next...`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test Complete');
  console.log('='.repeat(60) + '\n');
}

runTests();
