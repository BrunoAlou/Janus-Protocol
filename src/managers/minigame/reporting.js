/**
 * @param {string} key
 * @param {number} value
 * @returns {string}
 */
export function formatMetricValue(key, value) {
  if (key.includes('Time') || key.includes('duration')) {
    return `${Math.round(value / 1000)}s`;
  }
  if (key.includes('accuracy') || key.includes('Rate')) {
    return `${Math.round(value)}%`;
  }
  if (key === 'wpm') {
    return `${value} PPM`;
  }
  return String(value);
}

/**
 * @param {Object} params
 * @param {string} params.minigameId
 * @param {Object} params.progress
 * @param {(id:string)=>Object|null} params.getConfig
 * @returns {Array|null}
 */
export function extractMetricsForReport({ minigameId, progress, getConfig }) {
  if (!progress?.firstAttempt) {
    return null;
  }

  const config = getConfig(minigameId);
  const metrics = progress.firstAttempt.metrics || {};
  const labels = config?.metrics?.reportLabels || {};

  const result = [];
  Object.entries(metrics).forEach(([key, value]) => {
    if (labels[key]) {
      result.push({
        key,
        label: labels[key],
        value,
        formatted: formatMetricValue(key, value)
      });
    }
  });

  return result;
}

/**
 * @param {Object} params
 * @param {Map<string, Object>} params.progressMap
 * @param {(id:string)=>boolean} params.isEnabled
 * @param {(id:string)=>Object|null} params.getConfig
 * @param {(id:string)=>Object} params.getStats
 * @returns {Object}
 */
export function generateHRReport({ progressMap, isEnabled, getConfig, getStats }) {
  const report = {
    generatedAt: Date.now(),
    minigames: [],
    summary: {
      totalUnlocked: 0,
      totalAttempts: 0,
      averageEngagement: 0
    }
  };

  progressMap.forEach((progress, minigameId) => {
    if (!progress.unlocked || !isEnabled(minigameId)) return;

    const config = getConfig(minigameId);
    const stats = getStats(minigameId);

    report.minigames.push({
      id: minigameId,
      displayName: config.displayName,
      icon: config.icon,
      stats,
      metrics: extractMetricsForReport({ minigameId, progress, getConfig })
    });

    report.summary.totalUnlocked++;
    report.summary.totalAttempts += progress.totalAttempts;
  });

  if (report.summary.totalUnlocked > 0) {
    report.summary.averageEngagement = report.summary.totalAttempts / report.summary.totalUnlocked;
  }

  return report;
}
