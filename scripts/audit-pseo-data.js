
import { glossaryTerms } from './src/data/glossaryData.js';
import { comparisons } from './src/data/comparisonData.js';

console.log('--- Glossary Data Audit ---');
let glossaryErrors = 0;
glossaryTerms.forEach(term => {
    if (!term.slug) { console.error(`Missing slug for term: ${term.term}`); glossaryErrors++; }
    if (!term.shortDefinition) { console.error(`Missing shortDefinition for: ${term.slug}`); glossaryErrors++; }
    if (!term.fullDefinition || term.fullDefinition.length < 100) { console.warn(`Thin content warning for: ${term.slug}`); }
    if (!term.faqs || term.faqs.length === 0) { console.warn(`Missing FAQs for: ${term.slug}`); }
});

console.log('\n--- Comparison Data Audit ---');
let comparisonErrors = 0;
comparisons.forEach(comp => {
    if (!comp.slug) { console.error(`Missing slug for comparison: ${comp.toolA} vs ${comp.toolB}`); comparisonErrors++; }
    if (!comp.shortVerdict) { console.error(`Missing shortVerdict for: ${comp.slug}`); comparisonErrors++; }
    if (!comp.finalVerdict) { console.error(`Missing finalVerdict for: ${comp.slug}`); comparisonErrors++; }
});

if (glossaryErrors + comparisonErrors === 0) {
    console.log('\n✅ Data Layer looks solid!');
} else {
    console.log(`\n❌ Found ${glossaryErrors + comparisonErrors} issues.`);
}
