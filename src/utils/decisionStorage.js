/**
 * Utilitas penyimpanan lokal untuk Fitur Decision & Pikiran Saat Ini
 */

const DECISIONS_KEY = 'puncak_decisions';
const THOUGHTS_KEY = 'puncak_thoughts';

export function loadDecisions() {
  try {
    const raw = localStorage.getItem(DECISIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load decisions from localStorage:', e);
    return [];
  }
}

export function saveDecisions(decisions) {
  try {
    localStorage.setItem(DECISIONS_KEY, JSON.stringify(decisions || []));
  } catch (e) {
    console.error('Failed to save decisions to localStorage:', e);
  }
}

export function loadThoughts() {
  try {
    const raw = localStorage.getItem(THOUGHTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load thoughts from localStorage:', e);
    return [];
  }
}

export function saveThoughts(thoughts) {
  try {
    localStorage.setItem(THOUGHTS_KEY, JSON.stringify(thoughts || []));
  } catch (e) {
    console.error('Failed to save thoughts to localStorage:', e);
  }
}
