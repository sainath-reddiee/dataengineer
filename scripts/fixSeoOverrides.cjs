const fs = require('fs');

let content = fs.readFileSync('src/data/seoOverrides.js', 'utf8');

// Fix the missing comma after delta-lake-vs-iceberg entry
// The exact pattern is: }\r\n\n  'sql-pattern...
const searchStr = "}\r\n\n  'sql-pattern-that-kills-data-engineer-interviews'";
const replaceStr = "},\r\n\n  'sql-pattern-that-kills-data-engineer-interviews'";

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync('src/data/seoOverrides.js', content);
  console.log('✅ Fixed missing comma!');
} else {
  console.log('Search string not found. Debugging...');
  const idx = content.indexOf("delta-lake-vs-iceberg");
  idx = content.indexOf('}', idx);
  console.log('Exact context:', JSON.stringify(content.substring(idx, idx + 60)));
}