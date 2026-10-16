// Print a sponsor's private dashboard link.
//
// The key is an HMAC of the campaign id with DEHUB_SPONSOR_SECRET, the same
// secret defined in WordPress wp-config.php. Run it locally; never put the
// secret in a VITE_ variable or commit it.
//
// Usage:
//   DEHUB_SPONSOR_SECRET=... node scripts/sponsorDashboardLink.js <campaign-id>
//   (campaign-id is the sponsor's "token" in src/data/activeSponsors.json)
import { createHmac } from 'node:crypto';

const campaign = String(process.argv[2] || '').trim().toLowerCase();
const secret = process.env.DEHUB_SPONSOR_SECRET || '';

if (!campaign || !/^[a-z0-9_-]{3,64}$/.test(campaign)) {
  console.error('Usage: DEHUB_SPONSOR_SECRET=... node scripts/sponsorDashboardLink.js <campaign-id>');
  process.exit(1);
}
if (!secret) {
  console.error('Set DEHUB_SPONSOR_SECRET to the value defined in WordPress wp-config.php.');
  process.exit(1);
}

const key = createHmac('sha256', secret).update(campaign).digest('hex').slice(0, 32);
console.log(`https://dataengineerhub.blog/sponsors/dashboard?campaign=${encodeURIComponent(campaign)}&key=${key}`);
