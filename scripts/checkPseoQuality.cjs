const fs = require('fs');
const path = require('path');

function countWords(text) {
  if (!text) return 0;
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

console.log('=== GLOSSARY TERMS QUALITY CHECK ===');
const glossaryDir = path.join(__dirname, '../src/data/pseo/glossary');
const glossaryFiles = fs.readdirSync(glossaryDir).filter(f => f.endsWith('.json'));
let lowGlossary = 0;

for (const file of glossaryFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(glossaryDir, file), 'utf8'));
  if (Array.isArray(data)) {
    for (const term of data) {
      const words = countWords([
        term.shortDefinition,
        term.fullDefinition,
        term.practitionerIntro,
        term.gotchas,
        term.keyPoints,
        ...(term.faqs || []).flatMap(f => [f.question, f.answer])
      ].join(' '));
      
      if (words < 800) {
        console.log(`Glossary '${term.term}' (${term.slug}): ${words} words`);
        lowGlossary++;
      }
    }
  }
}
console.log('Total glossary terms with < 800 words:', lowGlossary);

console.log('\n=== COMPARISON PAGES QUALITY CHECK ===');
const comparisonsDir = path.join(__dirname, '../src/data/pseo/comparisons');
const comparisonFiles = fs.readdirSync(comparisonsDir).filter(f => f.endsWith('.json'));
let lowComparisons = 0;

for (const file of comparisonFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(comparisonsDir, file), 'utf8'));
  if (Array.isArray(data)) {
    for (const comp of data) {
      const words = countWords([
        comp.intro,
        comp.shortVerdict,
        comp.finalVerdict,
        comp.practitionerIntro,
        comp.features,
        comp.pros,
        comp.cons,
        ...(comp.faqs || []).flatMap(f => [f.question, f.answer])
      ].join(' '));
      
      if (words < 800) {
        console.log(`Comparison '${comp.toolA} vs ${comp.toolB}' (${comp.slug}): ${words} words`);
        lowComparisons++;
      }
    }
  }
}
console.log('Total comparisons with < 800 words:', lowComparisons);

console.log('\n=== CHEATSHEET PAGES QUALITY CHECK ===');
const cheatsheetPath = path.join(__dirname, '../src/data/cheatsheetData.js');
const cheatsheetContent = fs.readFileSync(cheatsheetPath, 'utf8');

// More robust parsing - extract between export const cheatsheets = [ and the final ];
let cheatsheetsStr = '';
const startMarker = 'export const cheatsheets = [';
const startIdx = cheatsheetContent.indexOf(startMarker);
if (startIdx !== -1) {
  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;
  
  for (let i = startIdx + startMarker.length; i < cheatsheetContent.length; i++) {
    const ch = cheatsheetContent[i];
    cheatsheetsStr += ch;
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    
    if ((ch === '"' || ch === "'" || ch === '`') && !inString) {
      inString = true;
      stringChar = ch;
    } else if (ch === stringChar && inString) {
      inString = false;
      stringChar = '';
    }
    
    if (!inString) {
      if (ch === '[' || ch === '{') braceCount++;
      else if (ch === ']' || ch === '}') braceCount--;
      
      if (braceCount === 0 && (ch === ']' || ch === '}')) {
        // Found the end
        break;
      }
    }
  }
}

let lowCheatsheets = 0;
try {
  const allCheatsheets = eval(cheatsheetsStr);
  
  for (const sheet of allCheatsheets) {
    const words = countWords([
      sheet.intro,
      sheet.shortDescription,
      ...(sheet.sections || []).flatMap(s => {
        if (s.type === 'table') return [s.columns, ...(s.items || []).flat()];
        if (s.type === 'code') return [s.code];
        if (s.type === 'checklist') return s.items.flatMap(i => [i.label, i.detail]);
        if (s.type === 'callout') return s.items.flatMap(i => [i.title, i.body]);
        if (s.type === 'tips') return s.items;
        if (Array.isArray(s.items)) return s.items.flatMap(i => typeof i === 'string' ? i : [i.question, i.answer, i.text].filter(Boolean));
        return [];
      }),
      ...(sheet.faqs || []).flatMap(f => [f.question, f.answer])
    ].join(' '));
    
    if (words < 800) {
      console.log(`Cheatsheet '${sheet.title}' (${sheet.slug}): ${words} words`);
      lowCheatsheets++;
    } else {
      console.log(`Cheatsheet '${sheet.title}' (${sheet.slug}): ${words} words ✓`);
    }
  }
  console.log('Total cheatsheets with < 800 words:', lowCheatsheets);
} catch (e) {
  console.log('Could not parse cheatsheets:', e.message);
}

console.log('\n=== TOOLS QUALITY CHECK ===');
const toolsCatalogPath = path.join(__dirname, '../src/data/toolsCatalog.js');
const toolsContent = fs.readFileSync(toolsCatalogPath, 'utf8');

const toolsMatch = toolsContent.match(/export\s+const\s+FEATURED_TOOLS\s*=\s*(\[[\s\S]*?\]);/);
let lowTools = 0;
if (toolsMatch) {
  try {
    const tools = eval(toolsMatch[1]);
    
    for (const tool of tools) {
      const words = countWords([
        tool.description,
        tool.longDescription,
        tool.howItWorks,
        ...(tool.faqs || []).flatMap(f => [f.question, f.answer])
      ].join(' '));
      
      if (words < 800 && !tool.external) {
        console.log(`Tool '${tool.title}' (${tool.slug}): ${words} words`);
        lowTools++;
      }
    }
    console.log('Total tools with < 800 words:', lowTools);
  } catch (e) {
    console.log('Could not parse tools:', e.message);
  }
}

console.log('\n=== SUMMARY ===');
console.log(`Glossary < 800 words: ${lowGlossary}`);
console.log(`Comparisons < 800 words: ${lowComparisons}`);
console.log(`Cheatsheets < 800 words: ${lowCheatsheets}`);
console.log(`Tools < 800 words: ${lowTools}`);