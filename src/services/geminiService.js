/**
 * Gemini AI Service for SEO Toolkit
 * Uses Google Generative AI REST API to avoid dependency issues
 *
 * API key is NOT bundled - admin enters it at runtime via setApiKey().
 */

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SESSION_KEY = 'gemini_api_key';

class GeminiService {
    constructor() {
        // Restore from sessionStorage if the admin already entered it this session
        this._apiKey = sessionStorage.getItem(SESSION_KEY) || '';
    }

    get isEnabled() {
        return !!this._apiKey;
    }

    /** Let the admin provide the key at runtime (stored only in sessionStorage). */
    setApiKey(key) {
        this._apiKey = key || '';
        if (key) {
            sessionStorage.setItem(SESSION_KEY, key);
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }

    /**
     * Generate content/suggestions using Gemini
     * @param {string} prompt - The user prompt or instruction
     * @param {string} context - The article content or data to analyze
     */
    async generateSuggestion(prompt, context = '') {
        if (!this.isEnabled) {
            throw new Error('Gemini API Key is missing. Use the API key input in the admin panel to configure it.');
        }

        try {
            const fullPrompt = `
                Role: Senior SEO Expert
                Task: ${prompt}
                
                Context/Content to Analyze:
                "${context.substring(0, 10000)}" 
                
                Output: Provide a concise, actionable, and direct answer. No fluff.
            `;

            const response = await fetch(`${API_URL}?key=${this._apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to fetch from Gemini API');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error('Gemini API Error:', error);
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

export const geminiService = new GeminiService();
export default geminiService;
