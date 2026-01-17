// White-Label Settings Component
// Toggle branding on/off for PDF exports and reports

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, CheckCircle } from 'lucide-react';
import pdfExportService from '../../services/pdfExportService';

export function WhiteLabelSettings() {
    const [whiteLabel, setWhiteLabel] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Load current setting
        const current = localStorage.getItem('whiteLabel') === 'true';
        setWhiteLabel(current);
    }, []);

    const handleToggle = () => {
        const newValue = !whiteLabel;
        setWhiteLabel(newValue);
        pdfExportService.setWhiteLabel(newValue);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {whiteLabel ? <EyeOff className="w-6 h-6 text-purple-400" /> : <Eye className="w-6 h-6 text-blue-400" />}
                        White-Label Mode
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Remove branding from PDF exports and reports
                    </p>
                </div>
                {saved && (
                    <div className="flex items-center gap-2 text-green-400 animate-fadeIn">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-semibold">Saved!</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-700/50">
                <div className="flex-1">
                    <div className="font-semibold text-white mb-1">
                        {whiteLabel ? 'White-Label Enabled' : 'Branding Enabled'}
                    </div>
                    <div className="text-sm text-gray-400">
                        {whiteLabel
                            ? 'PDFs will not include "DataEngineer Hub" branding'
                            : 'PDFs will include "DataEngineer Hub" branding'}
                    </div>
                </div>
                <button
                    onClick={handleToggle}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${whiteLabel ? 'bg-purple-600' : 'bg-gray-600'
                        }`}
                >
                    <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${whiteLabel ? 'translate-x-7' : 'translate-x-1'
                            }`}
                    />
                </button>
            </div>

            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                    <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-300">
                        <strong>Preview:</strong> When white-label is enabled, PDF exports will show:
                        <ul className="mt-2 space-y-1 ml-4 list-disc">
                            <li>Title: "SEO Analysis Report" (instead of "DataEngineer Hub - SEO Analysis Report")</li>
                            <li>No footer branding</li>
                            <li>Clean, professional appearance</li>
                        </ul>
                    </div>
                </div>
            </div>

            {!whiteLabel && (
                <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                        <Save className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-purple-300">
                            <strong>Upgrade to Pro:</strong> White-label mode is available in the Pro plan ($29/mo).
                            Remove all branding and present reports as your own.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WhiteLabelSettings;
