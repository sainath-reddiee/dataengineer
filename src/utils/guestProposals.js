const STORAGE_KEY = 'deh-guest-proposals';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getGuestProposals() {
  if (!canUseStorage()) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addGuestProposal(proposal) {
  const current = getGuestProposals();
  const entry = {
    id: `gp-${Date.now()}`,
    status: 'new',
    createdAt: new Date().toISOString(),
    ...proposal,
  };
  const next = [entry, ...current].slice(0, 80);
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return entry;
}

export function updateGuestProposal(id, patch) {
  const next = getGuestProposals().map((item) => (
    item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
  ));
  if (canUseStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function getOpenProposalCount() {
  return getGuestProposals().filter((item) => item.status === 'new' || item.status === 'review').length;
}
