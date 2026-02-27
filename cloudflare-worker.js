/**
 * Cloudflare Worker - pSEO Router for DataEngineer Hub
 * 
 * Routes:
 * - /glossary/* → R2 (pSEO glossary pages)
 * - /compare/* → R2 (pSEO comparison pages)  
 * - Everything else → Origin (Hostinger) - including sitemaps
 * 
 * Required Bindings:
 * - R2_BUCKET: R2 bucket named 'dataengineerhub-pseo'
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // R2 keys match the deploy script output structure (no prefix needed)

        // Debug endpoint
        if (path === '/debug') {
            return new Response(JSON.stringify({
                hasR2: !!env.R2_BUCKET,
                path: path,
                timestamp: new Date().toISOString()
            }, null, 2), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Dynamic 301 redirects (loaded from _redirects.json in R2)
        const cleanPath = path.replace(/\/$/, '');
        const redirect = await getRedirect(env, cleanPath);
        if (redirect) {
            return Response.redirect(`${url.origin}${redirect}`, 301);
        }

        // Handle glossary pages → R2
        if (path.startsWith('/glossary/') && path !== '/glossary/' && path !== '/glossary') {
            const slug = path.replace('/glossary/', '').replace(/\/$/, '');
            const key = `glossary/${slug}/index.html`;
            return fetchFromR2(env, key, 'text/html');
        }

        // Handle comparison pages → R2
        if (path.startsWith('/compare/') && path !== '/compare/' && path !== '/compare') {
            const slug = path.replace('/compare/', '').replace(/\/$/, '');
            const key = `compare/${slug}/index.html`;
            return fetchFromR2(env, key, 'text/html');
        }

        // Handle article pages → R2 (pre-rendered static HTML with unique canonical/content)
        if (path.startsWith('/articles/') && path !== '/articles/' && path !== '/articles') {
            const slug = path.replace('/articles/', '').replace(/\/$/, '');
            const key = `articles/${slug}/index.html`;

            // Try R2 first, fall back to origin if not found
            const r2Response = await fetchFromR2WithFallback(env, key);
            if (r2Response) return r2Response;
        }

        // Sitemaps are served directly from Hostinger (no R2 routing needed)

        // Everything else → Origin (Hostinger)
        return fetch(request);
    }
};

/**
 * Fetch content from R2 bucket
 */
async function fetchFromR2(env, key, contentType = 'text/html') {
    if (!env.R2_BUCKET) {
        return new Response('R2 bucket not configured', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }

    try {
        const object = await env.R2_BUCKET.get(key);

        if (!object) {
            return new Response(`Page not found: ${key}`, {
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        return new Response(object.body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // 1 day cache
                'X-R2-Key': key
            }
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

/**
 * Fetch from R2 with fallback - returns null if not found (instead of 404)
 * Used for article pages where we want to fall back to origin if not in R2
 */
async function fetchFromR2WithFallback(env, key) {
    if (!env.R2_BUCKET) return null;

    try {
        const object = await env.R2_BUCKET.get(key);
        if (!object) return null; // Fall back to origin

        return new Response(object.body, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=86400',
                'X-R2-Key': key,
                'X-Source': 'r2-static'
            }
        });
    } catch {
        return null; // Fall back to origin on error
    }
}

/**
 * Dynamic redirects - loads _redirects.json from R2 with in-memory caching
 * To add/update redirects: edit src/data/redirects.json and run deploy:articles
 */
let redirectsCache = null;
let redirectsCacheTime = 0;
const REDIRECTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getRedirect(env, path) {
    if (!env.R2_BUCKET) return null;

    // Use cached redirects if fresh
    const now = Date.now();
    if (redirectsCache && (now - redirectsCacheTime) < REDIRECTS_CACHE_TTL) {
        return redirectsCache[path] || null;
    }

    // Load from R2
    try {
        const object = await env.R2_BUCKET.get('_redirects.json');
        if (!object) {
            redirectsCache = {};
            redirectsCacheTime = now;
            return null;
        }

        const text = await object.text();
        redirectsCache = JSON.parse(text);
        redirectsCacheTime = now;
        return redirectsCache[path] || null;
    } catch {
        redirectsCache = {};
        redirectsCacheTime = now;
        return null;
    }
}
