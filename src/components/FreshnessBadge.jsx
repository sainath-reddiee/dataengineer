import React from 'react';

/**
 * FreshnessBadge Component
 * Displays "NEW" or "Updated" badges based on article dates
 * Increases CTR by highlighting fresh content
 */
const FreshnessBadge = ({ date, modifiedDate }) => {
    if (!date) return null;

    const now = new Date();
    const published = new Date(date);
    const modified = modifiedDate ? new Date(modifiedDate) : null;

    const daysSincePublish = Math.floor((now - published) / (1000 * 60 * 60 * 24));
    const daysSinceModified = modified ? Math.floor((now - modified) / (1000 * 60 * 60 * 24)) : null;

    // Show "NEW" badge for articles published within 7 days
    if (daysSincePublish <= 7) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 bg-green-500/20 border border-green-400/40 text-green-400 text-xs font-semibold rounded-full">
                ✨ NEW
            </span>
        );
    }

    // Show "Updated" badge for articles modified within 14 days
    if (daysSinceModified !== null && daysSinceModified <= 14 && daysSinceModified < daysSincePublish) {
        return (
            <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/20 border border-blue-400/40 text-blue-400 text-xs font-semibold rounded-full">
                🔄 Updated
            </span>
        );
    }

    return null;
};

export default FreshnessBadge;
