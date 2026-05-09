/**
 * Groq AI Service for SEO Toolkit
 * Uses Groq's OpenAI-compatible API (fast inference on open-source models).
 *
 * API key is NOT bundled - admin enters it at runtime via setApiKey().
 */

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const SESSION_KEY = 'groq_api_key';

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

        try {
            const userMessage = context
                ? `${prompt}\n\nContext/Content to Analyze:\n"${context.substring(0, 30000)}"`
                : prompt;

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._apiKey}`,
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: 'You are an expert content writer and SEO strategist. Write human-quality content that is specific, opinionated, and technically accurate. Never use AI-sounding filler phrases. Follow all instructions precisely.' },
                        { role: 'user', content: userMessage },
                    ],
                    temperature: 0.4,
                    max_tokens: 4096,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Groq API Error:', error);
            throw error;
        }
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
