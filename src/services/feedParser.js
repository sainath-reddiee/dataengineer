// Feed Parser Service
// Parses sitemap, RSS, JSON, and plain text URL lists

const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
];

class FeedParser {
    constructor() {
        this.proxyIndex = 0;
    }

    // Main entry point - parse any feed URL
    async parseUrl(url, format = 'auto') {
        try {
            const content = await this.fetchContent(url);
            if (format === 'auto') format = this.detectFormat(content);

            switch (format) {
                case 'sitemap': return this.parseSitemap(content);
                case 'rss': return this.parseRSS(content);
                case 'json': return this.parseJSON(content);
                case 'text': return this.parseText(content);
                default: throw new Error('Unknown format: ' + format);
            }
        } catch (error) {
            throw new Error(`Failed to parse feed: ${error.message}`);
        }
    }

    // Fetch content with CORS proxy fallback
    async fetchContent(url) {
        // Try direct fetch first
        try {
            const res = await fetch(url);
            if (res.ok) return await res.text();
        } catch (e) {
            // Continue to proxies
        }

        // Try each proxy
        for (let i = 0; i < CORS_PROXIES.length; i++) {
            const proxy = CORS_PROXIES[(this.proxyIndex + i) % CORS_PROXIES.length];
            try {
                const res = await fetch(proxy + encodeURIComponent(url));
                if (res.ok) {
                    const content = await res.text();
                    if (content && content.length > 100) {
                        this.proxyIndex = (this.proxyIndex + i) % CORS_PROXIES.length;
                        return content;
                    }
                }
            } catch (e) {
                continue;
            }
        }
        throw new Error('Failed to fetch feed from all proxies');
    }

    // Auto-detect feed format
    detectFormat(content) {
        const trimmed = content.trim();
        if (trimmed.includes('<urlset') || trimmed.includes('<sitemapindex')) return 'sitemap';
        if (trimmed.includes('<rss') || trimmed.includes('<feed') || trimmed.includes('<channel>')) return 'rss';
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
        return 'text';
    }

    // Parse XML Sitemap
    parseSitemap(xml) {
        const urls = [];

        // Handle sitemap index (multiple sitemaps)
        const sitemapLocs = xml.match(/<sitemap>\s*<loc>([^<]+)<\/loc>/gi) || [];
        if (sitemapLocs.length > 0) {
            console.log(`Found sitemap index with ${sitemapLocs.length} sitemaps`);
            // For now, just extract URLs from each sitemap entry
        }

        // Extract all <loc> tags
        const locRegex = /<loc>([^<]+)<\/loc>/gi;
        let match;
        while ((match = locRegex.exec(xml)) !== null) {
            const url = match[1].trim();
            // Filter out sitemap.xml files themselves
            if (!url.endsWith('sitemap.xml') && !url.endsWith('sitemap_index.xml')) {
                urls.push(url);
            }
        }

        return [...new Set(urls)]; // Remove duplicates
    }

    // Parse RSS/Atom Feed
    parseRSS(xml) {
        const urls = [];

        // Try <link> tags first
        const linkRegex = /<link>([^<]+)<\/link>/gi;
        let match;
        while ((match = linkRegex.exec(xml)) !== null) {
            const url = match[1].trim();
            if (url.startsWith('http') && !url.includes('?feed=') && !url.includes('/feed')) {
                urls.push(url);
            }
        }

        // Also try <guid> if it's a permalink
        const guidRegex = /<guid[^>]*>([^<]+)<\/guid>/gi;
        while ((match = guidRegex.exec(xml)) !== null) {
            const url = match[1].trim();
            if (url.startsWith('http')) {
                urls.push(url);
            }
        }

        // Also try Atom <link href="...">
        const atomLinkRegex = /<link[^>]+href="([^"]+)"[^>]*\/?\s*>/gi;
        while ((match = atomLinkRegex.exec(xml)) !== null) {
            const url = match[1].trim();
            if (url.startsWith('http') && !url.includes('/feed')) {
                urls.push(url);
            }
        }

        return [...new Set(urls)]; // Remove duplicates
    }

    // Parse JSON Feed
    parseJSON(json) {
        try {
            const data = JSON.parse(json);
            const urls = [];

            const extract = (obj, depth = 0) => {
                if (depth > 10) return; // Prevent infinite recursion

                if (Array.isArray(obj)) {
                    obj.forEach(item => extract(item, depth + 1));
                } else if (obj && typeof obj === 'object') {
                    // Common URL field names
                    const urlFields = ['url', 'link', 'loc', 'href', 'permalink', 'canonical'];
                    urlFields.forEach(field => {
                        if (obj[field] && typeof obj[field] === 'string' && obj[field].startsWith('http')) {
                            urls.push(obj[field]);
                        }
                    });
                    // Recurse into object values
                    Object.values(obj).forEach(val => extract(val, depth + 1));
                }
            };

            extract(data);
            return [...new Set(urls)];
        } catch (e) {
            throw new Error('Invalid JSON format');
        }
    }

    // Parse plain text (one URL per line)
    parseText(text) {
        return text
            .split(/[\n\r]+/)
            .map(line => line.trim())
            .filter(line => line.startsWith('http') && line.length > 10)
            .filter((url, index, self) => self.indexOf(url) === index); // Unique
    }

    // Validate if a string is a valid URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (e) {
            return false;
        }
    }
}

export default new FeedParser();
