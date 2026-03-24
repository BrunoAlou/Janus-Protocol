const STORAGE_KEY = 'janus_minigame_progress';

/**
 * @param {Map<string, boolean>} unlocked
 * @param {Map<string, Object>} progress
 */
export function saveMinigameStorage(unlocked, progress) {
  const data = {
    unlocked: Object.fromEntries(unlocked),
    progress: Object.fromEntries(progress)
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * @returns {{unlocked?: Object, progress?: Object}|null}
 */
export function readMinigameStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return null;
  }
  return JSON.parse(saved);
}

export function clearMinigameStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getUnlockFlagKey(minigameId) {
  return `minigame_unlocked_${minigameId}`;
}

export function isUnlockedByFlag(minigameId) {
  if (!window.gameState?.getFlag) {
    return false;
  }
  return window.gameState.getFlag(getUnlockFlagKey(minigameId)) === true;
}

export function setUnlockFlag(minigameId, unlocked) {
  if (!window.gameState?.setFlag) {
    return;
  }
  window.gameState.setFlag(getUnlockFlagKey(minigameId), unlocked === true);
}

export function getMockPublicAverages() {
  return {
    QuizGame: { averageScore: 65, standardDeviation: 18, totalPlayers: 500 },
    MemoryGame: { averageScore: 70, standardDeviation: 15, totalPlayers: 450 },
    PuzzleGame: { averageScore: 60, standardDeviation: 20, totalPlayers: 400 },
    TypingGame: { averageScore: 55, standardDeviation: 22, totalPlayers: 380 },
    SnakeGame: { averageScore: 50, standardDeviation: 25, totalPlayers: 200 },
    TetrisGame: { averageScore: 58, standardDeviation: 20, totalPlayers: 180 },
    WhackAMoleGame: { averageScore: 72, standardDeviation: 12, totalPlayers: 220 }
  };
}
