import {
  isBlogOwner,
  contributorRole,
  OWNER_BADGE_LABEL,
  OWNER_ROLE,
} from '../src/lib/contributorIdentity.js';

let failed = 0;
function ok(cond, msg) {
  if (cond) console.log(`  ✅ ${msg}`);
  else {
    failed += 1;
    console.log(`  ❌ ${msg}`);
  }
}

ok(isBlogOwner({ id: 1, name: 'Sainath Reddy' }), 'WP user id 1 is the owner');
ok(isBlogOwner({ name: 'Sainath Reddy' }), 'display name Sainath Reddy is the owner');
ok(isBlogOwner({ name: 'sainath' }), 'short name sainath is the owner');
ok(isBlogOwner({ slug: 'psainath123gmail-com' }), 'live WP nicename is the owner');
ok(isBlogOwner({ name: 'Sainath Reddy Pogaku' }), 'full legal name is the owner');
ok(!isBlogOwner({ id: 'guest_1', name: 'Jelte Lud' }), 'guest authors are not the owner');
ok(!isBlogOwner({ name: 'Bansilal Keloth', meta: { job_title: 'Lead data engineer' } }), 'other WP/guest names are not the owner');

ok(contributorRole({ id: 1, meta: { job_title: '' } }) === OWNER_ROLE, 'owner empty job_title does not become Guest Contributor');
ok(contributorRole({ name: 'Rashi Lachuriya', meta: { job_title: 'Marketing' } }) === 'Marketing', 'guest job titles are preserved');
ok(contributorRole({ name: 'Jelte Lud', meta: { job_title: '' } }) === 'Guest Contributor', 'untitled guests still fall back');
ok(OWNER_BADGE_LABEL === 'Founder & Owner', 'badge label is Founder & Owner');

if (failed) {
  console.error(`\n${failed} contributor identity check(s) failed`);
  process.exit(1);
}
console.log('\n✅ Contributor identity checks passed');
