/**
 * Groq AI Service for SEO Toolkit
 * Uses Groq's OpenAI-compatible API (fast inference on open-source models).
 *
 * API key is NOT bundled - admin enters it at runtime via setApiKey().
 */

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const SESSION_KEY = 'groq_api_key';
const REQUEST_TIMEOUT_MS = 30000;

class GroqService {
    constructor() {
        this._apiKey = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) || '';
    }

    get isEnabled() {
        return !!this._apiKey;
    }

    /** Let the admin provide the key at runtime (stored only in sessionStorage). */
    setApiKey(key) {
        this._apiKey = key || '';
        if (typeof sessionStorage === 'undefined') return;
        if (key) {
            sessionStorage.setItem(SESSION_KEY, key);
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }

    /**
     * Generate content/suggestions using Groq
     * @param {string} prompt - The user prompt or instruction
     * @param {string} context - The article content or data to analyze
     */
    async generateSuggestion(prompt, context = '') {
        if (!this.isEnabled) {
            throw new Error('Groq API Key is missing. Use the API key input in the admin panel to configure it.');
        }

        const userMessage = context
            ? `${prompt}\n\nContext/Content to Analyze:\n"${context.substring(0, 30000)}"`
            : prompt;

        const body = JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: 'You are an expert content writer and SEO strategist. Write human-quality content that is specific, opinionated, and technically accurate. Never use AI-sounding filler phrases. Follow all instructions precisely.' },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.4,
            max_tokens: 4096,
        });

        let lastError;
        for (let attempt = 0; attempt < 2; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this._apiKey}`,
                    },
                    body,
                });

                if (response.status === 429 && attempt === 0) {
                    const retryAfter = parseFloat(response.headers.get('Retry-After')) || 1.5;
                    await new Promise(r => setTimeout(r, Math.min(retryAfter * 1000, 5000)));
                    continue;
                }

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
                }

                const data = await response.json();
                const content = data?.choices?.[0]?.message?.content;
                if (!content) {
                    throw new Error('Groq returned an empty response. Try rephrasing your prompt.');
                }
                return content;
            } catch (error) {
                lastError = error;
                if (error.name === 'AbortError') {
                    throw new Error(`Groq request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`);
                }
                if (attempt === 1) throw error;
            } finally {
                clearTimeout(timer);
            }
        }
        throw lastError || new Error('Groq request failed.');
    }

    /**
     * Fix a specific SEO issue
     */
    async getQuickFix(issueLabel, currentContent) {
        return this.generateSuggestion(
            `Fix this SEO issue: "${issueLabel}". Provide ONLY the corrected version/text.`,
            currentContent
        );
    }

    /**
     * Generate a Meta Description
     */
    async generateMetaDescription(articleContent) {
        return this.generateSuggestion(
            'Generate a compelling, SEO-optimized meta description (max 160 chars).',
            articleContent
        );
    }
}

export const groqService = new GroqService();
export default groqService;
