// src/pages/admin/CtrLabPage.jsx
// Dedicated admin page for CTR Lab. Thin wrapper around CtrLabPanel so we can
// lazy-route it independently from the AI Suite page.

import React from 'react';
import { CtrLabPanel } from '@/components/admin/CtrLabPanel';

export function CtrLabPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">CTR Lab</h1>
                <p className="text-gray-400">
                    Heuristic scorer across every article to surface the biggest projected CTR-lift opportunities first.
                </p>
            </div>
            <CtrLabPanel />
        </div>
    );
}

export default CtrLabPage;
