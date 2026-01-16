/**
 * Gemini AI Service for SEO Toolkit
 * Uses Google Generative AI REST API to avoid dependency issues
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

class GeminiService {
    constructor() {
        this.isEnabled = !!API_KEY;
    }

    /**
     * Generate content/suggestions using Gemini
     * @param {string} prompt - The user prompt or instruction
     * @param {string} context - The article content or data to analyze
     */
    async generateSuggestion(prompt, context = '') {
        if (!this.isEnabled) {
            throw new Error('Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.');
        }

        try {
            const fullPrompt = `
                Role: Senior SEO Expert
                Task: ${prompt}
                
                Context/Content to Analyze:
                "${context.substring(0, 10000)}" 
                
                Output: Provide a concise, actionable, and direct answer. No fluff.
            `;

            const response = await fetch(`${API_URL}?key=${API_KEY}`, {
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
