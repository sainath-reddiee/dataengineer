/**
 * PSEO Data Watcher
 * 
 * Watches for changes in the monolithic data files:
 * - src/data/comparisonData.js
 * - src/data/glossaryData.js
 * 
 * When a change is detected, it automatically runs:
 * 1. scripts/migrate-pseo-data.js (to split the data)
 * 2. scripts/generate-search-index.js (to update the search index)
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'src', 'data');

const FILES_TO_WATCH = [
    path.join(DATA_DIR, 'comparisonData.js'),
    path.join(DATA_DIR, 'glossaryData.js')
];

let isRunning = false;

function runMigration() {
    if (isRunning) return;
    isRunning = true;

    console.log('\n👀 Change detected. Running pSEO migration...');

    // Run migration script
    const migrate = spawn('node', ['scripts/migrate-pseo-data.js'], { stdio: 'inherit', cwd: ROOT_DIR });

    migrate.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Migration successful. Updating search index...');

            // Run search index script
            const index = spawn('node', ['scripts/generate-search-index.js'], { stdio: 'inherit', cwd: ROOT_DIR });

            index.on('close', (idxCode) => {
                if (idxCode === 0) {
                    console.log('✅ Search index updated.');

                    // Run sitemap generator
                    console.log('🗺️  Regenerating sitemaps...');
                    const sitemap = spawn('node', ['scripts/lib/sitemap-generator.js'], { stdio: 'inherit', cwd: ROOT_DIR });

                    sitemap.on('close', (smCode) => {
                        isRunning = false;
                        if (smCode === 0) {
                            console.log('✨ All pSEO data & sitemaps updated successfully.\n');
                        } else {
                            console.error('❌ Sitemap generation failed.');
                        }
                    });
                } else {
                    console.error('❌ Search index generation failed.');
                    isRunning = false;
                }
            });
        } else {
            console.error('❌ Migration failed.');
            isRunning = false;
        }
    });
}

console.log('🔭 Watching pSEO data files for changes...');
FILES_TO_WATCH.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   - ${path.relative(ROOT_DIR, file)}`);
        // WatchFile is more consistent than watch for single files, though slightly slower polling
        fs.watchFile(file, { interval: 1000 }, (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                runMigration();
            }
        });
    } else {
        console.warn(`⚠️ File not found: ${file}`);
    }
});

// Keep process alive
process.stdin.resume();
