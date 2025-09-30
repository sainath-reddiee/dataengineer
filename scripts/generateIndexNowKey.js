// scripts/generateIndexNowKey.js
// Generate IndexNow API key and verification file
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = 'https://dataengineerhub.blog';

function generateIndexNowKey() {
  console.log('🔑 IndexNow Key Generator');
  console.log('=' .repeat(60));
  
  const publicDir = path.join(__dirname, '..', 'public');
  const keyFile = path.join(publicDir, 'indexnow-key.txt');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ Created public/ directory');
  }
  
  // Check if key already exists
  if (fs.existsSync(keyFile)) {
    const existingKey = fs.readFileSync(keyFile, 'utf8').trim();
    console.log('✅ Using existing IndexNow key');
    console.log(`📝 Key: ${existingKey}`);
    
    // Verify verification file exists
    const verificationFile = path.join(publicDir, `${existingKey}.txt`);
    if (!fs.existsSync(verificationFile)) {
      console.log('⚠️  Verification file missing, creating it...');
      fs.writeFileSync(verificationFile, existingKey, 'utf8');
      console.log(`✅ Created ${existingKey}.txt`);
    } else {
      console.log(`✅ Verification file exists: ${existingKey}.txt`);
    }
    
    console.log('');
    console.log('📋 Files created:');
    console.log(`   1. public/indexnow-key.txt`);
    console.log(`   2. public/${existingKey}.txt`);
    console.log('');
    console.log('🌐 After deployment, verify at:');
    console.log(`   ${SITE_URL}/indexnow-key.txt`);
    console.log(`   ${SITE_URL}/${existingKey}.txt`);
    
    return existingKey;
  }
  
  // Generate new key
  const key = crypto.randomBytes(16).toString('hex');
  
  console.log('🔑 Generated new IndexNow key');
  console.log(`📝 Key: ${key}`);
  
  // Save key file
  fs.writeFileSync(keyFile, key, 'utf8');
  console.log('✅ Created indexnow-key.txt');
  
  // Create verification file (filename = key)
  const verificationFile = path.join(publicDir, `${key}.txt`);
  fs.writeFileSync(verificationFile, key, 'utf8');
  console.log(`✅ Created ${key}.txt (verification file)`);
  
  console.log('');
  console.log('=' .repeat(60));
  console.log('✅ IndexNow setup complete!');
  console.log('=' .repeat(60));
  console.log('');
  console.log('📋 Files created:');
  console.log(`   1. public/indexnow-key.txt`);
  console.log(`   2. public/${key}.txt`);
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   1. Build your site: npm run build');
  console.log('   2. Deploy to Hostinger');
  console.log('   3. Verify files are accessible:');
  console.log(`      ${SITE_URL}/indexnow-key.txt`);
  console.log(`      ${SITE_URL}/${key}.txt`);
  console.log('   4. Run: npm run sitemap:notify');
  console.log('');
  
  return key;
}

// Run the generator
try {
  generateIndexNowKey();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}