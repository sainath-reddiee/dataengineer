import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Mail } from 'lucide-react';
import { EDITORIAL_BRIEFS } from '@/data/editorialBriefs';
import { getGuestProposals, updateGuestProposal } from '@/utils/guestProposals';

const STATUSES = ['new', 'review', 'accepted', 'declined'];

export function GuestProposalsPage() {
  const [items, setItems] = useState(() => getGuestProposals());

  const setStatus = (id, status) => {
    setItems(updateGuestProposal(id, { status }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Inbox className="w-7 h-7 text-blue-400" />
          Guest proposals
        </h1>
        <p className="text-gray-400">
          Pitches from <Link to="/contribute" className="text-blue-400 hover:underline">/contribute</Link> are stored in this browser
          and emailed when Web3Forms is configured. Accept one, then create the guest author under Contributors.
        </p>
      </div>

      <section className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
        <h2 className="text-lg font-bold text-white mb-3">Open briefs on the public page</h2>
        <ul className="space-y-2 text-sm text-gray-300">
          {EDITORIAL_BRIEFS.map((brief) => (
            <li key={brief.id}>
              <span className="text-white font-medium">{brief.title}</span>
              <span className="text-gray-500"> — {brief.stack}</span>
            </li>
          ))}
        </ul>
      </section>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-600 p-8 text-center text-gray-400">
          No pitches in this browser yet. Submit one on /contribute or ask a writer to.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.topic}</h3>
                  <p className="text-xs text-gray-400">
                    {item.name} · {item.email} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <select
                  value={item.status}
                  onChange={(e) => setStatus(item.id, e.target.value)}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              {item.incident && (
                <p className="text-sm text-amber-100/90 mb-2">
                  <span className="text-amber-300 font-semibold">Incident: </span>
                  {item.incident}
                </p>
              )}
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{item.outline}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                {item.repo && (
                  <a href={item.repo} className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">Repo</a>
                )}
                {item.portfolio && (
                  <a href={item.portfolio} className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">Sample</a>
                )}
                <a
                  href={`mailto:${item.email}?subject=${encodeURIComponent(`Re: ${item.topic}`)}`}
                  className="inline-flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" /> Reply
                </a>
                <Link to="/admin/contributors" className="text-blue-400 hover:underline">
                  Open Contributors
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GuestProposalsPage;
