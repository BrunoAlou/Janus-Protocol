import { getApiUrl } from '../config/apiConfig.js';

const DEBUG_UNLOCK_KEY = 'janus_debug_unlocked';

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function isProductionRuntime() {
  if (typeof window === 'undefined') return false;
  return !isLocalHost(window.location.hostname);
}

export function isDebugUnlocked() {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(DEBUG_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

function setDebugUnlocked(value) {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.sessionStorage.setItem(DEBUG_UNLOCK_KEY, '1');
    else window.sessionStorage.removeItem(DEBUG_UNLOCK_KEY);
  } catch {
    // ignore storage errors
  }
}

async function verifyDebugPassword(password) {
  const response = await fetch(getApiUrl('/api/debug/unlock'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    let message = 'Senha invalida.';
    try {
      const data = await response.json();
      if (data?.error === 'debug_password_not_configured') {
        message = 'Senha de debug nao configurada no backend.';
      }
    } catch {
      // keep fallback
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data?.ok === true;
}

function getCurrentMapScene() {
  const currentMap = window.sceneManager?.currentState?.map;
  if (!currentMap || !window.sceneManager?.game?.scene) return null;
  try {
    return window.sceneManager.game.scene.getScene(currentMap);
  } catch {
    return null;
  }
}

function applyDebugStateOnScene(mapScene, enabled) {
  if (!mapScene) return;
  if (mapScene.collisionDebugger) {
    mapScene.collisionDebugger.setEnabled(enabled);
  }
  if (mapScene.elementManager) {
    mapScene.elementManager.setDebugVisible(enabled);
  }
  window.debugEnabled = enabled;
}

export async function ensureDebugAccess() {
  if (!isProductionRuntime()) return true;
  if (isDebugUnlocked()) return true;

  const password = window.prompt('Digite a senha do debug manager:');
  if (!password) return false;

  const valid = await verifyDebugPassword(password);
  if (valid) {
    setDebugUnlocked(true);
    return true;
  }

  return false;
}

export async function toggleDebugWithAccessControl() {
  const mapScene = getCurrentMapScene();
  if (!mapScene) {
    window.alert('Nenhuma cena de mapa ativa para alternar debug.');
    return false;
  }

  try {
    const accessGranted = await ensureDebugAccess();
    if (!accessGranted) return false;

    const nextState = !(mapScene.collisionDebugger?.isEnabled?.() === true);
    applyDebugStateOnScene(mapScene, nextState);
    return nextState;
  } catch (error) {
    window.alert(error?.message || 'Nao foi possivel desbloquear o debug.');
    return false;
  }
}

export function installDebugHotkey() {
  if (typeof window === 'undefined') return;
  if (window.__janusDebugHotkeyInstalled) return;

  window.addEventListener('keydown', async (event) => {
    const isCtrlOrMeta = event.ctrlKey || event.metaKey;
    const isP = String(event.key || '').toLowerCase() === 'p';
    if (!isCtrlOrMeta || !isP) return;

    event.preventDefault();
    event.stopPropagation();

    await toggleDebugWithAccessControl();
  }, true);

  window.__janusDebugHotkeyInstalled = true;
}
