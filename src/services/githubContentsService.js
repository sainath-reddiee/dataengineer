/**
 * Browser-side GitHub Contents API helper.
 * Reuses the same sessionStorage PAT as Sponsor Manager
 * (`sponsors_github_config`) so one token covers both tools.
 * Production is static FTP — there is no backend to write files.
 */

const STORAGE_KEY = 'sponsors_github_config';

function getCleanToken(rawToken) {
  return (rawToken || '').trim().replace(/^(Bearer|token)\s+/i, '');
}

export function getGithubConfig() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      token: getCleanToken(parsed.token),
      owner: (parsed.owner || 'sainath-reddiee').trim(),
      repo: (parsed.repo || 'dataengineer').trim(),
      branch: (parsed.branch || 'main').trim(),
    };
  } catch {
    return { token: '', owner: 'sainath-reddiee', repo: 'dataengineer', branch: 'main' };
  }
}

export function hasGithubWriteToken() {
  return !!getGithubConfig().token;
}

async function fetchWithGithubAuth(url, ghToken, options = {}) {
  const cleanToken = getCleanToken(ghToken);
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let res = await fetch(url, {
    ...options,
    headers: { ...headers, Authorization: `Bearer ${cleanToken}` },
  });

  if (res.status === 401) {
    const fallback = await fetch(url, {
      ...options,
      headers: { ...headers, Authorization: `token ${cleanToken}` },
    });
    if (fallback.ok || fallback.status !== 401) return fallback;
  }
  return res;
}

export function utf8ToBase64(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

export function base64ToUtf8(b64) {
  const cleaned = String(b64 || '').replace(/\s/g, '');
  return decodeURIComponent(
    Array.from(atob(cleaned), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
  );
}

/**
 * Fetch a text file from GitHub, patch it, and commit the result.
 * @returns {{ sha: string, htmlUrl?: string }}
 */
export async function commitTextFile({ path, message, transform }) {
  const { token, owner, repo, branch } = getGithubConfig();
  if (!token) {
    throw new Error('GitHub PAT missing. Open Sponsor Manager → Setup PAT Token (same session token is reused here).');
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const getRes = await fetchWithGithubAuth(`${apiUrl}?ref=${branch}`, token);
  if (!getRes.ok) {
    const errData = await getRes.json().catch(() => ({}));
    let detail = errData.message || getRes.statusText;
    if (getRes.status === 401) detail = '401 Bad Credentials (PAT invalid or expired)';
    if (getRes.status === 403) detail = '403 Forbidden (missing Contents: Read & write)';
    if (getRes.status === 404) detail = `404 Not Found (repo ${owner}/${repo} or ${path} inaccessible)`;
    throw new Error(`GitHub API Error: ${detail}`);
  }

  const getData = await getRes.json();
  const current = base64ToUtf8(getData.content || '');
  const next = transform(current);
  if (next === current) {
    throw new Error('No file change produced — title/description may already match.');
  }

  const putRes = await fetchWithGithubAuth(apiUrl, token, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: utf8ToBase64(next),
      sha: getData.sha,
      branch,
    }),
  });

  if (!putRes.ok) {
    const errData = await putRes.json().catch(() => ({}));
    throw new Error(errData.message || `GitHub PUT failed (${putRes.status})`);
  }

  const putData = await putRes.json();
  return {
    sha: putData.content?.sha || putData.commit?.sha,
    htmlUrl: putData.commit?.html_url,
  };
}
