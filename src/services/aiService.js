/**
 * Unified AI Service Facade
 * Routes to either Gemini or Groq based on admin selection.
 * Consumers import this instead of individual provider services.
 */

import { geminiService } from './geminiService';
import { groqService } from './groqService';

const PROVIDER_KEY = 'ai_provider'; // sessionStorage key

class AIService {
    constructor() {
        this._provider = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(PROVIDER_KEY)) || 'gemini';
    }

    get provider() {
        return this._provider;
    }

    get isEnabled() {
        return this._getService().isEnabled;
    }

    setProvider(name) {
        this._provider = name === 'groq' ? 'groq' : 'gemini';
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem(PROVIDER_KEY, this._provider);
        }
    }

    setApiKey(key) {
        this._getService().setApiKey(key);
    }

    _getService() {
        return this._provider === 'groq' ? groqService : geminiService;
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
