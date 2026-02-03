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
