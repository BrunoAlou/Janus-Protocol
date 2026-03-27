import { generateBaseReport } from './baseReportEngine.js';

const SESSION_KEY = 'janus_base_report_payload';
const LOCAL_KEY = 'janus_base_report_payload_local';

function getModeFromDebug(debugEnabled) {
  return debugEnabled ? 'debug' : 'prod';
}

export function openBaseReportFromGame(options = {}) {
  const debugEnabled = options.debugEnabled === true;
  const mode = options.mode || getModeFromDebug(debugEnabled);

  if (!window.gameState || typeof window.gameState.getState !== 'function') {
    throw new Error('GameStateManager not available to generate report.');
  }

  const state = window.gameState.getState();
  const report = generateBaseReport({
    state,
    minigameManager: window.minigameManager,
    mode
  });

  const serialized = JSON.stringify({
    createdAt: Date.now(),
    payload: report
  });

  // sessionStorage funciona na mesma aba; localStorage cobre abertura em nova aba.
  window.sessionStorage.setItem(SESSION_KEY, serialized);
  window.localStorage.setItem(LOCAL_KEY, serialized);

  const base = import.meta.env.BASE_URL || '/';
  const reportUrl = new URL(`report.html?mode=${encodeURIComponent(mode)}`, `${window.location.origin}${base}`);
  window.open(reportUrl.toString(), '_blank', 'noopener');
}

export function readReportFromSession() {
  try {
    const rawSession = window.sessionStorage.getItem(SESSION_KEY);
    const rawLocal = window.localStorage.getItem(LOCAL_KEY);
    const raw = rawSession || rawLocal;
    if (!raw) return null;

    const decoded = JSON.parse(raw);
    const payload = decoded?.payload || decoded;

    if (rawLocal) {
      // Consumo one-shot para reduzir risco de estado stale.
      window.localStorage.removeItem(LOCAL_KEY);
    }

    return payload;
  } catch {
    return null;
  }
}
