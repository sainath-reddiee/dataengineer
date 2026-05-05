# Google Search Console Integration — Setup Guide

Connect your Rank Intelligence Dashboard to **real Google Search Console data** to see actual impressions, clicks, CTR, and rank positions for every URL on your blog.

---

## What You Get

| Feature | Without GSC | With GSC Connected |
|---------|-------------|--------------------|
| Rank position | Estimated from health score | Real avg position per URL |
| Impressions | Not shown | Last 28 days from Google |
| Clicks | Not shown | Last 28 days from Google |
| CTR | Estimated via CTR scorer | Real CTR per URL |
| Top queries | Not shown | Actual keywords driving traffic |

---

## Prerequisites

- A Google account that owns (or has access to) your Search Console property `https://dataengineerhub.blog/`
- Admin access to your GitHub repository
- 10 minutes

---

## Step 1: Create OAuth 2.0 Client ID

### 1.1 Open Google Cloud Console
Visit **https://console.cloud.google.com/**

### 1.2 Create a project (or use existing)
- Click the project dropdown (top left) → **NEW PROJECT**
- Name: `DataEngineerHub Blog` (or anything)
- Click **CREATE**
- Wait a few seconds, then select the new project from the dropdown

### 1.3 Enable the Search Console API
- Left sidebar → **APIs & Services** → **Library**
- Search for **"Google Search Console API"**
- Click it → **ENABLE**

### 1.4 Configure OAuth Consent Screen
- Left sidebar → **APIs & Services** → **OAuth consent screen**
- User type: **External** → **CREATE**
- Fill in:
  - App name: `DataEngineerHub Admin`
  - User support email: your email
  - Developer contact email: your email
- Click **SAVE AND CONTINUE**
- Scopes: click **ADD OR REMOVE SCOPES** → search for `webmasters.readonly` → check it → **UPDATE** → **SAVE AND CONTINUE**
- Test users: add your own Google account email → **ADD** → **SAVE AND CONTINUE**
- Summary → **BACK TO DASHBOARD**

### 1.5 Create OAuth 2.0 Client ID
- Left sidebar → **APIs & Services** → **Credentials**
- Click **+ CREATE CREDENTIALS** → **OAuth client ID**
- Application type: **Web application**
- Name: `DataEngineerHub Admin Web Client`

- **Authorized JavaScript origins** — click **+ ADD URI** for each:
  ```
  https://dataengineerhub.blog
  http://localhost:5173
  ```

- **Authorized redirect URIs** — click **+ ADD URI** for each:
  ```
  https://dataengineerhub.blog/admin/rank-dashboard
  http://localhost:5173/admin/rank-dashboard
  ```

- Click **CREATE**

### 1.6 Copy the Client ID
A modal will show:
- **Your Client ID**: `123456789012-abcdefghijk.apps.googleusercontent.com`
- **Your Client Secret**: (not needed — we use implicit flow)

Copy the **Client ID**. You don't need the secret.

---

## Step 2: Add the Secret to GitHub

### 2.1 Go to your repo settings
Visit **https://github.com/sainath-reddiee/dataengineer/settings/secrets/actions**

### 2.2 Add new secret
- Click **New repository secret**
- Name: `VITE_GSC_CLIENT_ID`
- Value: paste the Client ID from Step 1.6 (e.g., `123456789012-abcdefghijk.apps.googleusercontent.com`)
- Click **Add secret**

---

## Step 3: Add to Local `.env` (for local dev)

In your project root, edit `.env` and add:

```
VITE_GSC_CLIENT_ID=123456789012-abcdefghijk.apps.googleusercontent.com
```

(Same value as the GitHub secret.)

---

## Step 4: Verify Search Console Ownership

Visit **https://search.google.com/search-console**

Make sure:
- The property `https://dataengineerhub.blog/` is listed
- It's verified (green checkmark)
- You're signed in with the **same Google account** that will authorize the OAuth flow

If not verified, follow Google's verification steps (DNS TXT record, HTML file upload, or Google Analytics).

---

## Step 5: Deploy

Push any commit to `main` — GitHub Actions will automatically:
1. Read `VITE_GSC_CLIENT_ID` from secrets
2. Inject it into the Vite build
3. Deploy to Vercel/FTP

Or trigger manually:
```bash
git commit --allow-empty -m "chore: trigger rebuild with GSC client ID"
git push
```

---

## Step 6: Connect in the Admin Dashboard

1. Visit **https://dataengineerhub.blog/admin/rank-dashboard**
2. Log in to admin
3. Click the **Connect GSC** button (top right)
4. Google OAuth consent screen appears → click **Continue** → **Allow**
5. You'll be redirected back to the dashboard
6. The button changes to **"GSC Connected"** with real data below

---

## How the Token Works

- The OAuth access token is stored in **`sessionStorage`** — it's cleared when you close the tab
- Tokens expire after **1 hour** — you'll need to reconnect after that
- The token is **never sent to your server** or stored in localStorage/cookies
- You can click **Disconnect** anytime to clear the token immediately

This is the safest OAuth model for a pure frontend admin panel.

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
The redirect URI in your OAuth Client ID doesn't match the URL you're on. Double-check:
- In Google Cloud Console → Credentials → your OAuth Client → Authorized redirect URIs
- Must include EXACTLY: `https://dataengineerhub.blog/admin/rank-dashboard`
- No trailing slash, exact match

### "Error 403: access_denied"
Your Google account isn't verified as a Search Console owner for the property, OR the OAuth consent screen has you as a test user but you haven't published it.

Fix: In OAuth consent screen → add your email to **Test users**, or click **PUBLISH APP** (requires Google verification for external users beyond test users).

### "GSC token expired"
Tokens last 1 hour. Click **Disconnect** → **Connect GSC** again.

### Button says "Set VITE_GSC_CLIENT_ID in .env to enable"
Either:
- You haven't added the env var locally (add to `.env`)
- The deploy didn't pick up the secret (check GitHub Actions logs)
- You need to hard-refresh the browser after redeploy

---

## Security Notes

- **The Client ID is public by design** — it's embedded in your frontend JS bundle
- Google validates the redirect URI against your Cloud Console allowlist, so attackers can't use your Client ID from their own domains
- The `webmasters.readonly` scope gives **read-only** access — the app cannot modify your Search Console data
- Users must approve the OAuth consent screen on each connect — no silent re-authorization

---

## What's Next

Once connected, the dashboard shows:
- Total impressions / clicks / avg position / CTR for last 28 days (ending 3 days ago — GSC has data lag)
- Each article's real rank position automatically fed into the Rank Intelligence scorer
- Better "rank estimate" accuracy and more actionable top-action recommendations

Happy ranking!
