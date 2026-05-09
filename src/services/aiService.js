/**
 * Unified AI Service Facade
 * Smart routing: uses whichever provider has a key configured.
 * If both have keys, uses the admin's selected preference.
 * If only one has a key, uses that one regardless of selection.
 */

import { geminiService } from './geminiService';
import { groqService } from './groqService';

const PROVIDER_KEY = 'ai_provider'; // sessionStorage key

class AIService {
    constructor() {
        this._preferred = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(PROVIDER_KEY)) || 'gemini';
    }

    get provider() {
        return this._getActiveProvider();
    }

    get isEnabled() {
        return geminiService.isEnabled || groqService.isEnabled;
    }

    setProvider(name) {
        this._preferred = name === 'groq' ? 'groq' : 'gemini';
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(PROVIDER_KEY, this._preferred);
        }
    }

    setApiKey(key) {
        // Set key on the preferred provider
        if (this._preferred === 'groq') {
            groqService.setApiKey(key);
        } else {
            geminiService.setApiKey(key);
        }
    }

    /**
     * Smart provider resolution:
     * 1. If preferred provider has a key → use it
     * 2. If preferred doesn't have a key but the other does → fallback to other
     * 3. If neither has a key → return preferred (will show "key missing" error)
     */
    _getActiveProvider() {
        if (this._preferred === 'groq') {
            if (groqService.isEnabled) return 'groq';
            if (geminiService.isEnabled) return 'gemini';
            return 'groq';
        } else {
            if (geminiService.isEnabled) return 'gemini';
            if (groqService.isEnabled) return 'groq';
            return 'gemini';
        }
    }

    _getService() {
        const active = this._getActiveProvider();
        return active === 'groq' ? groqService : geminiService;
    }

    async generateSuggestion(prompt, context = '') {
        return this._getService().generateSuggestion(prompt, context);
    }

    async getQuickFix(issueLabel, currentContent) {
        return this._getService().getQuickFix(issueLabel, currentContent);
    }

    async generateMetaDescription(articleContent) {
        return this._getService().generateMetaDescription(articleContent);
    }
}

export const aiService = new AIService();
export default aiService;
