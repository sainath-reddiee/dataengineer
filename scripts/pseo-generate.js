#!/usr/bin/env node
/**
 * PSEO Auto-Generation CLI
 * Generate glossary terms or comparisons using AI
 * 
 * Usage:
 *   npm run pseo:generate                    # Interactive mode
 *   npm run pseo:generate -- --type glossary --count 5
 *   npm run pseo:generate -- --type comparison --count 3
 */

import 'dotenv/config';
import readline from 'readline';
import { createAIProvider, getAvailableProviders } from './lib/ai-providers.js';
import { getGlossaryPrompt, getComparisonPrompt, getTopicSuggestionsPrompt } from './lib/prompts.js';
import { addGlossaryTerms, addComparisons, getExistingGlossarySlugs, getExistingComparisonSlugs } from './lib/data-writer.js';
import { regenerateAllSitemaps } from './lib/sitemap-generator.js';

// =============================================================================
// GITHUB-STYLE CLI UTILITIES
// =============================================================================

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Detect CI environment (GitHub Actions, etc.)
const isCI = process.env.CI === 'true' || process.argv.includes('--ci');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function log(msg, color = '') {
    console.log(`${color}${msg}${colors.reset}`);
}

function header(title) {
    console.log('\n' + '═'.repeat(60));
    log(`  ${title}`, colors.bright + colors.cyan);
    console.log('═'.repeat(60) + '\n');
}

function success(msg) { log(`✓ ${msg}`, colors.green); }
function warning(msg) { log(`⚠ ${msg}`, colors.yellow); }
function error(msg) { log(`✗ ${msg}`, colors.red); }
function info(msg) { log(`ℹ ${msg}`, colors.blue); }

async function prompt(question) {
    return new Promise(resolve => {
        rl.question(`${colors.cyan}? ${colors.reset}${question} `, resolve);
    });
}

async function select(question, options) {
    if (isCI) {
        const defaultOption = options[0];
        console.log(`${colors.cyan}? ${colors.reset}${question} ${colors.green}→ ${defaultOption.label || defaultOption} (auto-selected in CI)${colors.reset}`);
        return defaultOption.value || defaultOption;
    }

    console.log(`\n${colors.cyan}? ${colors.reset}${question}\n`);

    options.forEach((opt, i) => {
        const prefix = i === 0 ? `${colors.cyan}❯${colors.reset}` : ' ';
        console.log(`  ${prefix} ${opt.label || opt}`);
    });

    console.log(`\n${colors.dim}  Use number keys to select${colors.reset}`);

    const answer = await prompt(`Enter choice (1-${options.length}):`);
    const index = parseInt(answer) - 1;

    if (index >= 0 && index < options.length) {
        return options[index].value || options[index];
    }
    return options[0].value || options[0];
}

async function confirm(question) {
    if (isCI) {
        console.log(`${colors.cyan}? ${colors.reset}${question} ${colors.green}(auto-confirmed in CI)${colors.reset}`);
        return true;
    }
    const answer = await prompt(`${question} (Y/n):`);
    return answer.toLowerCase() !== 'n';
}

// =============================================================================
// CONTENT GENERATION
// =============================================================================

async function generateGlossaryTerms(ai, count, category = null) {
    const existingSlugs = getExistingGlossarySlugs();
    const existingTerms = existingSlugs.slice(0, 20);

    info(`Found ${existingSlugs.length} existing glossary terms`);

    // First, get topic suggestions from AI
    header('Step 1: Getting Topic Suggestions');

    const suggestPrompt = getTopicSuggestionsPrompt('glossary', count, existingTerms);
    let suggestions;

    try {
        suggestions = await ai.generate(suggestPrompt);
        if (suggestions.raw) {
            suggestions = JSON.parse(suggestions.raw);
        }
    } catch (e) {
        error(`Failed to get suggestions: ${e.message}`);
        return [];
    }

    console.log('\n📋 Suggested topics:\n');
    suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.term} (${s.category}) - ${s.priority} priority`);
    });

    const proceed = await confirm('\nGenerate content for these topics?');
    if (!proceed) {
        info('Cancelled by user');
        return [];
    }

    // Generate content for each topic
    header('Step 2: Generating Content');

    const generated = [];

    for (let i = 0; i < suggestions.length; i++) {
        const topic = suggestions[i];
        process.stdout.write(`\n⏳ [${i + 1}/${suggestions.length}] Generating: ${topic.term}...`);

        try {
            const contentPrompt = getGlossaryPrompt(topic.term, topic.category, existingSlugs);
            const content = await ai.generate(contentPrompt);

            if (content.raw) {
                throw new Error('Invalid JSON response');
            }

            // Validate content
            const wordCount = (content.fullDefinition || '').split(/\s+/).length;
            const faqCount = (content.faqs || []).length;

            if (wordCount < 200) {
                console.log(` ${colors.yellow}⚠ Too short (${wordCount} words)${colors.reset}`);
                continue;
            }

            if (faqCount < 3) {
                console.log(` ${colors.yellow}⚠ Not enough FAQs (${faqCount})${colors.reset}`);
                continue;
            }

            console.log(` ${colors.green}✓ ${wordCount} words, ${faqCount} FAQs${colors.reset}`);
            generated.push(content);

        } catch (e) {
            console.log(` ${colors.red}✗ Failed: ${e.message}${colors.reset}`);
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(r => setTimeout(r, 1000));
    }

    return generated;
}

async function generateComparisons(ai, count) {
    const existingSlugs = getExistingComparisonSlugs();

    info(`Found ${existingSlugs.length} existing comparisons`);

    // Get topic suggestions
    header('Step 1: Getting Comparison Suggestions');

    const suggestPrompt = getTopicSuggestionsPrompt('comparison', count, existingSlugs);
    let suggestions;

    try {
        suggestions = await ai.generate(suggestPrompt);
        if (suggestions.raw) {
            suggestions = JSON.parse(suggestions.raw);
        }
    } catch (e) {
        error(`Failed to get suggestions: ${e.message}`);
        return [];
    }

    console.log('\n📋 Suggested comparisons:\n');
    suggestions.forEach((s, i) => {
        console.log(`  ${i + 1}. ${s.toolA} vs ${s.toolB} (${s.category})`);
    });

    const proceed = await confirm('\nGenerate content for these comparisons?');
    if (!proceed) {
        info('Cancelled by user');
        return [];
    }

    // Generate content
    header('Step 2: Generating Content');

    const generated = [];

    for (let i = 0; i < suggestions.length; i++) {
        const comp = suggestions[i];
        process.stdout.write(`\n⏳ [${i + 1}/${suggestions.length}] Generating: ${comp.toolA} vs ${comp.toolB}...`);

        try {
            const contentPrompt = getComparisonPrompt(comp.toolA, comp.toolB, comp.category);
            const content = await ai.generate(contentPrompt);

            if (content.raw) {
                throw new Error('Invalid JSON response');
            }

            console.log(` ${colors.green}✓ Generated${colors.reset}`);
            generated.push(content);

        } catch (e) {
            console.log(` ${colors.red}✗ Failed: ${e.message}${colors.reset}`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    return generated;
}

// =============================================================================
// MAIN CLI
// =============================================================================

async function main() {
    header('🚀 PSEO Auto-Generator');

    // Check for available AI providers
    const available = getAvailableProviders();

    if (available.length === 0) {
        error('No AI providers configured!');
        console.log('\nAdd one of these to your .env.local file:');
        console.log('  VITE_GEMINI_API_KEY=your_key');
        console.log('  OPENAI_API_KEY=your_key');
        process.exit(1);
    }

    info(`Available providers: ${available.join(', ')}`);

    // Parse command line args - support both --type=value and --type value formats
    const args = process.argv.slice(2);

    function getArg(name) {
        // Check for --name=value format
        const equalsArg = args.find(a => a.startsWith(`--${name}=`));
        if (equalsArg) return equalsArg.split('=')[1];

        // Check for --name value format
        const flagIndex = args.indexOf(`--${name}`);
        if (flagIndex !== -1 && args[flagIndex + 1] && !args[flagIndex + 1].startsWith('--')) {
            return args[flagIndex + 1];
        }
        return null;
    }

    const typeArg = getArg('type');
    const countArg = parseInt(getArg('count')) || null;
    const categoryArg = getArg('category');

    // Interactive mode if no args
    let contentType = typeArg;
    let count = countArg;
    let provider = available[0];

    if (!contentType) {
        contentType = await select('What would you like to generate?', [
            { label: '📚 Glossary Terms (definitions, FAQs)', value: 'glossary' },
            { label: '⚔️  Tool Comparisons (vs pages)', value: 'comparison' },
            { label: '🔄 Regenerate Sitemaps Only', value: 'sitemaps' }
        ]);
    }

    if (contentType === 'sitemaps') {
        await regenerateAllSitemaps();
        rl.close();
        return;
    }

    if (!count) {
        if (isCI) {
            count = 5; // Default in CI mode
            info('Using default count of 5 in CI mode');
        } else {
            const countStr = await prompt('How many pages to generate?');
            count = parseInt(countStr) || 5;
        }
    }

    if (available.length > 1) {
        provider = await select('Select AI provider:', available.map(p => ({
            label: p === 'gemini' ? '🌟 Gemini (Recommended - Free)' : '🤖 OpenAI (Paid)',
            value: p
        })));
    }

    info(`Using ${provider} to generate ${count} ${contentType} pages`);

    // Create AI provider
    let ai;
    try {
        ai = createAIProvider(provider);
        success(`Connected to ${ai.name}`);
    } catch (e) {
        error(e.message);
        process.exit(1);
    }

    // Generate content
    let generated = [];

    if (contentType === 'glossary') {
        generated = await generateGlossaryTerms(ai, count);
    } else if (contentType === 'comparison') {
        generated = await generateComparisons(ai, count);
    }

    if (generated.length === 0) {
        warning('No content generated');
        rl.close();
        return;
    }

    // Write to data files
    header('Step 3: Writing to Data Files');

    let result;
    if (contentType === 'glossary') {
        result = await addGlossaryTerms(generated);
        success(`Added ${result.added} new glossary terms`);
        if (result.skipped > 0) {
            warning(`Skipped ${result.skipped} duplicates`);
        }
    } else {
        result = await addComparisons(generated);
        success(`Added ${result.added} new comparisons`);
    }

    // Regenerate sitemaps
    header('Step 4: Regenerating Sitemaps');
    await regenerateAllSitemaps();

    // Summary
    header('✨ Generation Complete!');
    console.log(`  📊 Generated: ${generated.length} pages`);
    console.log(`  📝 Written to: src/data/${contentType === 'glossary' ? 'glossaryData.js' : 'comparisonData.js'}`);
    console.log(`  🗺️  Sitemaps: Updated`);
    console.log(`\n  Next: Run ${colors.cyan}npm run build${colors.reset} and deploy!`);

    rl.close();
}

main().catch(e => {
    error(e.message);
    process.exit(1);
});
