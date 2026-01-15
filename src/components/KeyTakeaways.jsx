import React from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Key Takeaways Component for AEO (Answer Engine Optimization)
 * 
 * DESIGNED FOR AI VISIBILITY:
 * - Uses clear semantic structure
 * - Bullet points are easily parsed by LLMs
 * - "Key Takeaways" header is a strong signal for summary generation
 */
const KeyTakeaways = ({ items }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="my-8 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-blue-500" />
                Key Takeaways
            </h3>
            <ul className="space-y-3">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {item}
                        </span>
                    </li>
                ))}
            </ul>
            {/* Hidden text for AI context if needed */}
            <div className="sr-only">
                Summary of main points for {items.length} key concepts covered in this article.
            </div>
        </div>
    );
};

export default KeyTakeaways;
