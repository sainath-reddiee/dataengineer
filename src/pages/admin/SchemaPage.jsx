// src/pages/admin/SchemaPage.jsx
/**
 * Schema Generator Page
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, Copy, Check, FileJson } from 'lucide-react';
import { copyToClipboard } from '@/utils/seo/exportUtils';

const schemaTypes = [
    { id: 'article', label: 'Article', desc: 'Blog posts and news articles' },
    { id: 'faq', label: 'FAQPage', desc: 'Frequently asked questions' },
    { id: 'howto', label: 'HowTo', desc: 'Step-by-step instructions' },
    { id: 'breadcrumb', label: 'BreadcrumbList', desc: 'Navigation path' },
];

export function SchemaPage() {
    const [type, setType] = useState('article');
    const [copied, setCopied] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        url: '',
        image: '',
        author: 'Sainath Reddy',
        datePublished: '',
        faqs: [{ question: '', answer: '' }],
        steps: [{ name: '', text: '' }],
        breadcrumbs: [{ name: 'Home', url: 'https://dataengineerhub.blog' }]
    });

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const generateSchema = () => {
        switch (type) {
            case 'article':
                return {
                    "@context": "https://schema.org",
                    "@type": "Article",
                    "headline": form.title,
                    "description": form.description,
                    "image": form.image,
                    "author": { "@type": "Person", "name": form.author },
                    "datePublished": form.datePublished,
                    "mainEntityOfPage": { "@type": "WebPage", "@id": form.url }
                };
            case 'faq':
                return {
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    "mainEntity": form.faqs.filter(f => f.question && f.answer).map(f => ({
                        "@type": "Question",
                        "name": f.question,
                        "acceptedAnswer": { "@type": "Answer", "text": f.answer }
                    }))
                };
            case 'howto':
                return {
                    "@context": "https://schema.org",
                    "@type": "HowTo",
                    "name": form.title,
                    "description": form.description,
                    "step": form.steps.filter(s => s.name && s.text).map((s, i) => ({
                        "@type": "HowToStep",
                        "position": i + 1,
                        "name": s.name,
                        "text": s.text
                    }))
                };
            case 'breadcrumb':
                return {
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": form.breadcrumbs.filter(b => b.name && b.url).map((b, i) => ({
                        "@type": "ListItem",
                        "position": i + 1,
                        "name": b.name,
                        "item": b.url
                    }))
                };
            default:
                return {};
        }
    };

    const handleCopy = async () => {
        const schema = JSON.stringify(generateSchema(), null, 2);
        const scriptTag = `<script type="application/ld+json">\n${schema}\n</script>`;
        await copyToClipboard(scriptTag);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const addItem = (key) => {
        const emptyItem = key === 'faqs' ? { question: '', answer: '' } :
            key === 'steps' ? { name: '', text: '' } :
                { name: '', url: '' };
        updateForm(key, [...form[key], emptyItem]);
    };

    const updateItem = (key, index, field, value) => {
        const items = [...form[key]];
        items[index][field] = value;
        updateForm(key, items);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Schema Generator</h1>
                <p className="text-gray-400">Generate JSON-LD structured data</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-4">
                    {/* Type Selector */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
                        <div className="grid grid-cols-2 gap-2">
                            {schemaTypes.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setType(t.id)}
                                    className={`p-3 rounded-xl text-left transition-all ${type === t.id
                                            ? 'bg-blue-500/20 border border-blue-500/50'
                                            : 'bg-slate-700/50 hover:bg-slate-700'
                                        }`}
                                >
                                    <p className="text-white font-medium">{t.label}</p>
                                    <p className="text-xs text-gray-500">{t.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Form */}
                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 space-y-4">
                        {(type === 'article' || type === 'howto') && (
                            <>
                                <input type="text" placeholder="Title/Headline" value={form.title} onChange={(e) => updateForm('title', e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400" />
                                <textarea placeholder="Description" value={form.description} onChange={(e) => updateForm('description', e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 h-24" />
                            </>
                        )}

                        {type === 'article' && (
                            <>
                                <input type="text" placeholder="URL" value={form.url} onChange={(e) => updateForm('url', e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400" />
                                <input type="text" placeholder="Image URL" value={form.image} onChange={(e) => updateForm('image', e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400" />
                                <input type="date" value={form.datePublished} onChange={(e) => updateForm('datePublished', e.target.value)} className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white" />
                            </>
                        )}

                        {type === 'faq' && (
                            <div className="space-y-3">
                                {form.faqs.map((faq, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-slate-900/50 rounded-lg">
                                        <input type="text" placeholder={`Question ${i + 1}`} value={faq.question} onChange={(e) => updateItem('faqs', i, 'question', e.target.value)} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm" />
                                        <textarea placeholder="Answer" value={faq.answer} onChange={(e) => updateItem('faqs', i, 'answer', e.target.value)} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm h-16" />
                                    </div>
                                ))}
                                <button onClick={() => addItem('faqs')} className="text-blue-400 text-sm">+ Add FAQ</button>
                            </div>
                        )}

                        {type === 'howto' && (
                            <div className="space-y-3">
                                {form.steps.map((step, i) => (
                                    <div key={i} className="space-y-2 p-3 bg-slate-900/50 rounded-lg">
                                        <input type="text" placeholder={`Step ${i + 1} Name`} value={step.name} onChange={(e) => updateItem('steps', i, 'name', e.target.value)} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm" />
                                        <textarea placeholder="Instructions" value={step.text} onChange={(e) => updateItem('steps', i, 'text', e.target.value)} className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm h-16" />
                                    </div>
                                ))}
                                <button onClick={() => addItem('steps')} className="text-blue-400 text-sm">+ Add Step</button>
                            </div>
                        )}

                        {type === 'breadcrumb' && (
                            <div className="space-y-3">
                                {form.breadcrumbs.map((crumb, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input type="text" placeholder="Name" value={crumb.name} onChange={(e) => updateItem('breadcrumbs', i, 'name', e.target.value)} className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm" />
                                        <input type="text" placeholder="URL" value={crumb.url} onChange={(e) => updateItem('breadcrumbs', i, 'url', e.target.value)} className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 text-sm" />
                                    </div>
                                ))}
                                <button onClick={() => addItem('breadcrumbs')} className="text-blue-400 text-sm">+ Add Breadcrumb</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileJson className="w-5 h-5 text-blue-400" />
                            <span className="text-white font-medium">Generated Schema</span>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <pre className="bg-slate-900/50 p-4 rounded-xl overflow-x-auto text-sm text-green-400 font-mono max-h-96">
                        {JSON.stringify(generateSchema(), null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}

export default SchemaPage;
