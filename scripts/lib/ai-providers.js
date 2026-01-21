/**
 * AI Providers for PSEO Content Generation
 * Supports: Gemini (default), OpenAI, Snowflake Cortex
 */

import 'dotenv/config';

// =============================================================================
// GEMINI PROVIDER (Recommended - Free tier available)
// =============================================================================

class GeminiProvider {
    constructor() {
        this.apiKey = process.env.VITE_GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

        if (!this.apiKey) {
            throw new Error('VITE_GEMINI_API_KEY not found. Add it to .env.local');
        }
    }

    async generate(prompt, options = {}) {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: options.temperature || 0.7,
                            maxOutputTokens: options.maxTokens || 4096,
                            responseMimeType: 'application/json'
                        }
                    })
                });

                // Handle rate limits with retry
                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 5; // 10s, 20s, 40s
                    console.log(`⏳ Rate limited. Waiting ${waitTime}s before retry ${attempt}/${maxRetries}...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                    continue;
                }

                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Gemini API error: ${error}`);
                }

                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!text) {
                    throw new Error('No content returned from Gemini');
                }

                // Parse JSON from response
                try {
                    return JSON.parse(text);
                } catch {
                    // If response isn't valid JSON, return raw text
                    return { raw: text };
                }
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    const waitTime = Math.pow(2, attempt) * 5;
                    console.log(`⚠️ Error: ${error.message}. Retrying in ${waitTime}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                }
            }
        }

        throw lastError || new Error('Failed after max retries');
    }

    get name() { return 'Gemini'; }
}

// =============================================================================
// OPENAI PROVIDER (Optional - Best quality)
// =============================================================================

class OpenAIProvider {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';

        if (!this.apiKey) {
            throw new Error('OPENAI_API_KEY not found. Add it to .env.local');
        }
    }

    async generate(prompt, options = {}) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: options.model || 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 4096,
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (!text) {
            throw new Error('No content returned from OpenAI');
        }

        return JSON.parse(text);
    }

    get name() { return 'OpenAI'; }
}

// =============================================================================
// PROVIDER FACTORY
// =============================================================================

const providers = {
    gemini: GeminiProvider,
    openai: OpenAIProvider,
};

export function createAIProvider(name = 'gemini') {
    const Provider = providers[name.toLowerCase()];
    if (!Provider) {
        throw new Error(`Unknown AI provider: ${name}. Available: ${Object.keys(providers).join(', ')}`);
    }
    return new Provider();
}

export function getAvailableProviders() {
    const available = [];

    if (process.env.VITE_GEMINI_API_KEY) available.push('gemini');
    if (process.env.OPENAI_API_KEY) available.push('openai');

    return available;
}

export { GeminiProvider, OpenAIProvider };
