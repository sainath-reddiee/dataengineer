// src/utils/seo/exportUtils.js
/**
 * Export utilities for SEO reports
 * Supports Markdown, CSV, and JSON exports
 */

/**
 * Export SEO report as Markdown
 */
export function exportToMarkdown(report, options = {}) {
    const { includeDetails = true, title = 'SEO Analysis Report' } = options;

    let md = `# ${title}\n\n`;
    md += `**URL:** ${report.url || 'N/A'}\n`;
    md += `**Score:** ${report.score}/100 (${report.grade})\n`;
    md += `**Analyzed:** ${new Date(report.analyzedAt).toLocaleString()}\n\n`;

    // Summary
    md += `## Summary\n\n`;
    md += `| Status | Count |\n|--------|-------|\n`;
    md += `| ✅ Good | ${report.summary?.good || 0} |\n`;
    md += `| ⚠️ Warning | ${report.summary?.warning || 0} |\n`;
    md += `| ❌ Critical | ${report.summary?.critical || 0} |\n`;
    md += `| ℹ️ Info | ${report.summary?.info || 0} |\n\n`;

    // Critical Issues
    const criticals = report.checks?.filter(c => c.severity === 'critical') || [];
    if (criticals.length > 0) {
        md += `## ❌ Critical Issues\n\n`;
        criticals.forEach(c => {
            md += `- **${c.name}**: ${c.message}\n`;
            if (c.recommendation) md += `  - Fix: ${c.recommendation}\n`;
        });
        md += '\n';
    }

    // Warnings
    const warnings = report.checks?.filter(c => c.severity === 'warning') || [];
    if (warnings.length > 0) {
        md += `## ⚠️ Warnings\n\n`;
        warnings.forEach(c => {
            md += `- **${c.name}**: ${c.message}\n`;
            if (c.recommendation) md += `  - Fix: ${c.recommendation}\n`;
        });
        md += '\n';
    }

    // Passed
    const goods = report.checks?.filter(c => c.severity === 'good') || [];
    if (goods.length > 0) {
        md += `## ✅ Passed\n\n`;
        goods.forEach(c => {
            md += `- **${c.name}**: ${c.message}\n`;
        });
    }

    return md;
}

/**
 * Export SEO report as CSV
 */
export function exportToCSV(report) {
    const headers = ['Check', 'Category', 'Status', 'Message', 'Recommendation'];
    const rows = [headers.join(',')];

    (report.checks || []).forEach(check => {
        const row = [
            `"${check.name}"`,
            `"${check.category || ''}"`,
            check.severity,
            `"${(check.message || '').replace(/"/g, '""')}"`,
            `"${(check.recommendation || '').replace(/"/g, '""')}"`
        ];
        rows.push(row.join(','));
    });

    return rows.join('\n');
}

/**
 * Export SEO report as JSON
 */
export function exportToJSON(report) {
    return JSON.stringify(report, null, 2);
}

/**
 * Download file helper
 */
export function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    }
}

export default { exportToMarkdown, exportToCSV, exportToJSON, downloadFile, copyToClipboard };
