import { deriveProfilesFromState } from '../profile/DerivedProfileEngine.js';

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function toPercent(part, total) {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round(clamp01(part / total) * 100);
}

function pickFirstNumber(source, keys) {
  for (const key of keys) {
    const raw = source?.[key];
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function toPositiveNumberOrNull(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function mapAxisShort(axis) {
  const map = {
    execution: 'E',
    collaboration: 'C',
    resilience: 'R',
    innovation: 'I'
  };
  return map[axis] || '?';
}

function normalizeSourceName(source) {
  if (!source) return 'Fonte';
  const value = String(source).trim();
  if (!value) return 'Fonte';
  return value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function formatDurationCompact(ms) {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function buildSessionTiming(stats = {}) {
  const now = Date.now();
  const loginInputAtMs = toPositiveNumberOrNull(stats.session_login_input_at_ms);
  const firstInteractionAtMs = toPositiveNumberOrNull(stats.session_first_interaction_at_ms);
  const lastInteractionAtMs = toPositiveNumberOrNull(stats.session_last_interaction_at_ms);

  const interactionCount = Number(stats.session_interaction_count || 0);
  const gapSumMs = Number(stats.session_interaction_gap_sum_ms || 0);
  const gapCount = Number(stats.session_interaction_gap_count || 0);
  const averageGapMs = gapCount > 0 ? Math.round(gapSumMs / gapCount) : null;
  const lastGapMs = toPositiveNumberOrNull(stats.session_last_interaction_gap_ms);
  const recentGapsMs = Array.isArray(stats.session_recent_interaction_gaps_ms)
    ? stats.session_recent_interaction_gaps_ms
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value >= 0)
        .slice(-10)
    : [];

  const elapsedSinceLoginMs = loginInputAtMs ? Math.max(0, now - loginInputAtMs) : null;
  const timeToFirstInteractionMs = loginInputAtMs && firstInteractionAtMs
    ? Math.max(0, firstInteractionAtMs - loginInputAtMs)
    : null;
  const idleSinceLastInteractionMs = lastInteractionAtMs
    ? Math.max(0, now - lastInteractionAtMs)
    : null;

  return {
    loginInputAtMs,
    firstInteractionAtMs,
    lastInteractionAtMs,
    interactionCount,
    gapCount,
    averageGapMs,
    lastGapMs,
    recentGapsMs,
    elapsedSinceLoginMs,
    timeToFirstInteractionMs,
    idleSinceLastInteractionMs,
    elapsedSinceLoginLabel: formatDurationCompact(elapsedSinceLoginMs),
    timeToFirstInteractionLabel: formatDurationCompact(timeToFirstInteractionMs),
    averageGapLabel: formatDurationCompact(averageGapMs),
    lastGapLabel: formatDurationCompact(lastGapMs),
    idleSinceLastInteractionLabel: formatDurationCompact(idleSinceLastInteractionMs)
  };
}

function buildAxisChoiceTimeline(stats = {}) {
  const rawChain = Array.isArray(stats.axis_choice_blockchain) ? stats.axis_choice_blockchain : [];
  const rawTimeline = Array.isArray(stats.axis_choice_timeline) ? stats.axis_choice_timeline : [];

  const chainDerivedTimeline = rawChain
    .map((block) => ({
      at: toPositiveNumberOrNull(new Date(block?.insertedAt || 0).getTime()) || toPositiveNumberOrNull(block?.at),
      axis: block?.payload?.axis,
      source: block?.payload?.source || block?.payload?.sourceId || 'Fonte',
      sourceId: block?.payload?.sourceId || null,
      label: block?.payload?.label || null,
      optionId: block?.payload?.optionId || null
    }))
    .filter((entry) => entry.axis);

  const sourceTimeline = rawTimeline.length > 0 ? rawTimeline : chainDerivedTimeline;

  const normalizedTimeline = sourceTimeline
    .map((entry) => {
      const axis = entry?.axis;
      if (!axis || !['execution', 'collaboration', 'resilience', 'innovation'].includes(axis)) {
        return null;
      }

      const source = normalizeSourceName(entry?.source || entry?.sourceId || 'Fonte');
      const at = toPositiveNumberOrNull(entry?.at);
      return {
        at,
        axis,
        axisShort: mapAxisShort(axis),
        source,
        sourceId: entry?.sourceId || null,
        label: entry?.label || null,
        optionId: entry?.optionId || null
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.at || 0) - (b.at || 0));

  const compactSequence = normalizedTimeline
    .map((entry) => `${entry.axisShort}(${entry.source})`)
    .join('>');

  let chainBrokenAt = -1;
  for (let i = 1; i < rawChain.length; i++) {
    const prev = rawChain[i - 1];
    const current = rawChain[i];
    if ((current?.prev_hash || null) !== (prev?.hash || null)) {
      chainBrokenAt = i;
      break;
    }
  }

  return {
    count: normalizedTimeline.length,
    compactSequence,
    timeline: normalizedTimeline,
    blockchain: {
      blocks: rawChain,
      totalBlocks: rawChain.length,
      isValid: chainBrokenAt === -1,
      brokenAt: chainBrokenAt
    }
  };
}

function countUnlockedFlags(flags) {
  if (!flags || typeof flags !== 'object') return 0;
  return Object.entries(flags).filter(([key, value]) => key.endsWith('_unlocked') && value === true).length;
}

function computeAxisProfile(stats = {}, flags = {}) {
  const points = {
    execution: Number(stats.axis_points_execution || 0),
    collaboration: Number(stats.axis_points_collaboration || 0),
    resilience: Number(stats.axis_points_resilience || 0),
    innovation: Number(stats.axis_points_innovation || 0)
  };

  const priorityAxis = flags.receptionist_priority_axis;
  if (priorityAxis && points[priorityAxis] === 0) {
    // Base fallback: primeira prioridade da recepcionista vira sinal minimo do eixo.
    points[priorityAxis] = 1;
  }

  const total = Object.values(points).reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
  const normalized = total > 0
    ? {
        execution: Math.round((points.execution / total) * 100),
        collaboration: Math.round((points.collaboration / total) * 100),
        resilience: Math.round((points.resilience / total) * 100),
        innovation: Math.round((points.innovation / total) * 100)
      }
    : {
        execution: 0,
        collaboration: 0,
        resilience: 0,
        innovation: 0
      };

  const detectedAxis = Object.entries(points).filter(([, value]) => value > 0).map(([key]) => key);

  return {
    points,
    normalized,
    totalPoints: total,
    detectedAxis,
    priorityAxis: priorityAxis || null,
    coverage: toPercent(detectedAxis.length, 4)
  };
}

function buildFixedResults(state) {
  const stats = state?.player?.stats || {};
  const flags = state?.player?.flags || {};
  const quests = state?.player?.quests || {};

  const sessionTiming = buildSessionTiming(stats);

  const completionTimeSec = pickFirstNumber(stats, [
    'session_elapsed_since_login_sec',
    'session_duration_from_login_sec',
    'completion_time_sec',
    'session_duration_sec',
    'total_play_time_sec',
    'play_time_sec'
  ]) || (sessionTiming.elapsedSinceLoginMs ? Math.round(sessionTiming.elapsedSinceLoginMs / 1000) : null);

  const interactionsCount = pickFirstNumber(stats, [
    'session_interaction_count',
    'interactions_count',
    'total_interactions',
    'npc_interactions',
    'element_interactions'
  ]);

  const objectivesCompletionRate = pickFirstNumber(stats, [
    'objectives_completion_rate',
    'objective_completion_rate'
  ]);

  const journeysCompleted = Object.values(quests).filter((status) => status === 'completed').length || null;
  const elementsUnlocked = countUnlockedFlags(flags) || null;

  const required = [
    completionTimeSec,
    interactionsCount,
    elementsUnlocked,
    journeysCompleted,
    objectivesCompletionRate
  ];
  const available = required.filter((value) => value !== null).length;

  return {
    enabled: available > 0,
    completionTimeSec,
    interactionsCount,
    elementsUnlocked,
    journeysCompleted,
    objectivesCompletionRate,
    coverage: toPercent(available, required.length),
    missing: {
      completionTimeSec: completionTimeSec === null,
      interactionsCount: interactionsCount === null,
      elementsUnlocked: elementsUnlocked === null,
      journeysCompleted: journeysCompleted === null,
      objectivesCompletionRate: objectivesCompletionRate === null
    }
  };
}

function buildMinigameSection(minigameManager) {
  if (!minigameManager || typeof minigameManager.generateHRReport !== 'function') {
    return {
      enabled: false,
      reason: 'minigame-manager-unavailable',
      coverage: 0
    };
  }

  const raw = minigameManager.generateHRReport();
  const totalUnlocked = Number(raw?.summary?.totalUnlocked || 0);
  if (totalUnlocked <= 0) {
    return {
      enabled: false,
      reason: 'no-minigames-unlocked',
      coverage: 0
    };
  }

  return {
    enabled: true,
    coverage: 100,
    summary: {
      totalUnlocked,
      totalAttempts: Number(raw?.summary?.totalAttempts || 0),
      averageEngagement: Number(raw?.summary?.averageEngagement || 0)
    },
    minigames: Array.isArray(raw?.minigames) ? raw.minigames : []
  };
}

function buildBadgesSection(state, minigameSection) {
  const stats = state?.player?.stats || {};
  const flags = state?.player?.flags || {};

  const templates = [
    {
      id: 'badge_observador',
      title: 'Observador',
      source: 'stats.interactiveHoverCount',
      value: Number(stats.interactiveHoverCount || 0),
      operator: '>=',
      threshold: 25
    },
    {
      id: 'badge_impaciente',
      title: 'Impaciente',
      source: 'stats.dialogEscSkips',
      value: Number(stats.dialogEscSkips || 0),
      operator: '>=',
      threshold: 5
    },
    {
      id: 'badge_ja_sei',
      title: 'Ja Sei',
      source: 'flags.tutorial_skipped',
      value: flags.tutorial_skipped === true ? 1 : 0,
      operator: '==',
      threshold: 1
    },
    {
      id: 'badge_persistente',
      title: 'Persistente',
      source: 'minigames.totalAttempts',
      value: Number(minigameSection?.summary?.totalAttempts || 0),
      operator: '>=',
      threshold: 3
    }
  ];

  const evaluated = templates.map((item) => {
    const earned = item.operator === '=='
      ? item.value === item.threshold
      : item.value >= item.threshold;

    return {
      id: item.id,
      title: item.title,
      earned,
      criteria: `${item.source} ${item.operator} ${item.threshold}`,
      evidence: `${item.source}=${item.value}`,
      confidence: 'low'
    };
  });

  const earnedBadges = evaluated.filter((badge) => badge.earned);

  const availableSignals = evaluated.filter((b) => {
    if (b.id === 'badge_ja_sei') return true;
    const value = Number((b.evidence.split('=')[1] || '').trim());
    return Number.isFinite(value) && value > 0;
  }).length;

  return {
    enabled: true,
    coverage: toPercent(availableSignals, evaluated.length),
    badges: earnedBadges,
    allBadges: evaluated,
    coverageMeta: {
      availableSignals,
      totalSignals: evaluated.length,
      formula: 'availableSignals / totalSignals * 100'
    }
  };
}

function buildChoicesTrace(state) {
  const stats = state?.player?.stats || {};
  const flags = state?.player?.flags || {};
  const quests = state?.player?.quests || {};
  const sessionTiming = buildSessionTiming(stats);
  const axisTimeline = buildAxisChoiceTimeline(stats);

  const axisChoices = [
    'execution',
    'collaboration',
    'resilience',
    'innovation'
  ].map((axis) => ({
    axis,
    points: Number(stats[`axis_points_${axis}`] || 0)
  })).filter((entry) => entry.points > 0);

  const completedQuests = Object.entries(quests)
    .filter(([, status]) => status === 'completed')
    .map(([questId]) => questId);

  const trueFlags = Object.entries(flags)
    .filter(([, value]) => value === true)
    .map(([flag]) => flag)
    .slice(0, 20);

  const recentInteractions = Array.isArray(stats.session_interaction_timeline)
    ? stats.session_interaction_timeline
        .slice(-12)
        .map((entry) => ({
          at: toPositiveNumberOrNull(entry?.at),
          scene: entry?.scene || null,
          elementId: entry?.elementId || null,
          elementName: entry?.elementName || null,
          interactionType: entry?.interactionType || null
        }))
    : [];

  return {
    priorityAxis: flags.receptionist_priority_axis || null,
    tutorialSkipped: flags.tutorial_skipped === true,
    axisChoices,
    axisChoiceSequence: axisTimeline.compactSequence,
    axisChoiceCount: axisTimeline.count,
    axisChoiceTimeline: axisTimeline.timeline,
    axisChoiceBlockchain: axisTimeline.blockchain,
    sessionTiming,
    recentInteractions,
    completedQuests,
    trueFlags
  };
}

function buildNarrativeAudit(state, runtimeSummary, derivedProfiles) {
  const flags = state?.player?.flags || {};
  const stats = state?.player?.stats || {};

  const endingPayload = stats.ending_payload || null;
  const endingHistory = Array.isArray(stats.ending_history) ? stats.ending_history : [];
  const runtime = runtimeSummary || {};
  const history = Array.isArray(runtime.history) ? runtime.history : [];

  return {
    enabled: true,
    ending: {
      resolved: flags.ending_resolved === true,
      endingId: flags.ending_id || endingPayload?.endingId || null,
      objective: flags.ending_objective || endingPayload?.objective || null,
      dominantAxis: flags.ending_dominant_axis || endingPayload?.dominantAxis || null,
      tone: flags.ending_tone || endingPayload?.tone || null,
      resolvedAtMs: Number(flags.ending_resolved_at_ms || endingPayload?.resolvedAt || 0) || null,
      latestPayload: endingPayload,
      history: endingHistory
    },
    runtime: {
      dilemmasResolved: Number(runtime?.runtimeDilemmas?.resolved || 0),
      optionsSelected: Number(runtime?.runtimeDilemmas?.selectedOptions || 0),
      journeysCompleted: Number(runtime?.runtimeJourneys?.completed || 0),
      journeysTotal: Number(runtime?.runtimeJourneys?.total || 0),
      impactTotals: runtime?.impactTotals || {},
      bySource: runtime?.bySource || {},
      byDilemma: runtime?.byDilemma || {},
      historyPreview: history.slice(-15)
    },
    profileCalibration: {
      dominantAxis: derivedProfiles?.dominantAxis || null,
      confidenceGlobal: Number(derivedProfiles?.confidence?.global || 0),
      confidenceComponents: derivedProfiles?.confidence?.components || {},
      calibrationPreset: derivedProfiles?.confidence?.diagnostics?.calibrationPreset || 'default'
    }
  };
}

export function generateBaseReport({ state, minigameManager, mode = 'prod' }) {
  const safeState = state || {};
  const stats = safeState?.player?.stats || {};
  const flags = safeState?.player?.flags || {};
  const derivedProfiles = deriveProfilesFromState(safeState);

  const profile = computeAxisProfile(stats, flags);
  const fixedResults = buildFixedResults(safeState);
  const minigames = buildMinigameSection(minigameManager);
  const badges = buildBadgesSection(safeState, minigames);
  const choicesTrace = buildChoicesTrace(safeState);
  const runtimeSummary = window.dilemmaJourneyRuntime?.buildRuntimeSummary?.(safeState) || null;
  const narrativeAudit = buildNarrativeAudit(safeState, runtimeSummary, derivedProfiles);

  const sectionCoverage = {
    profile: profile.coverage,
    fixedResults: fixedResults.coverage,
    minigames: minigames.coverage,
    badges: badges.coverage
  };

  const globalCompleteness = Math.round(
    (sectionCoverage.profile + sectionCoverage.fixedResults + sectionCoverage.minigames + sectionCoverage.badges) / 4
  );

  const coverageBreakdown = {
    profile: {
      available: profile.detectedAxis.length,
      total: 4,
      formula: 'detectedAxis / 4 * 100',
      percentage: sectionCoverage.profile
    },
    fixedResults: {
      available: [
        fixedResults.completionTimeSec,
        fixedResults.interactionsCount,
        fixedResults.elementsUnlocked,
        fixedResults.journeysCompleted,
        fixedResults.objectivesCompletionRate
      ].filter((value) => value !== null).length,
      total: 5,
      formula: 'availableKpis / 5 * 100',
      percentage: sectionCoverage.fixedResults
    },
    minigames: {
      available: minigames.enabled ? 1 : 0,
      total: 1,
      formula: 'hasMinigameData ? 1 : 0',
      percentage: sectionCoverage.minigames,
      reason: minigames.enabled ? null : minigames.reason
    },
    badges: {
      available: badges.coverageMeta.availableSignals,
      total: badges.coverageMeta.totalSignals,
      formula: badges.coverageMeta.formula,
      percentage: sectionCoverage.badges
    },
    global: {
      formula: '(profile + fixedResults + minigames + badges) / 4',
      rawAverage: (sectionCoverage.profile + sectionCoverage.fixedResults + sectionCoverage.minigames + sectionCoverage.badges) / 4,
      rounded: globalCompleteness
    }
  };

  const report = {
    schemaVersion: '1.0.0',
    engineVersion: 'base-report-engine-1',
    mode,
    generatedAt: new Date().toISOString(),
    player: {
      id: safeState?.auth?.user?.id || safeState?.auth?.user?.sub || 'guest',
      name: safeState?.auth?.user?.name || null,
      provider: safeState?.auth?.provider || 'guest'
    },
    coverage: {
      globalCompleteness,
      bySection: sectionCoverage,
      breakdown: coverageBreakdown,
      notes: [
        'Report base adaptativo: secoes sem dados aparecem com cobertura baixa ou ficam ocultas.',
        'Sem sinais suficientes de eixo, o perfil usa fallback de prioridade da recepcionista quando disponivel.',
        'Sem minigames desbloqueados, secao de minigames nao e exibida.'
      ]
    },
    sections: {
      profile: {
        enabled: profile.totalPoints > 0,
        gpi: profile.normalized,
        derived: {
          disc: derivedProfiles.disc,
          bigFive: derivedProfiles.bigFive,
          confidence: derivedProfiles.confidence,
          dominantAxis: derivedProfiles.dominantAxis
        },
        source: {
          totalPoints: profile.totalPoints,
          detectedAxis: profile.detectedAxis,
          priorityAxis: profile.priorityAxis
        }
      },
      fixedResults,
      minigames,
      badges,
      runtime: runtimeSummary,
      narrativeAudit
    }
  };

  if (mode === 'debug') {
    report.debug = {
      profileCalculation: {
        points: profile.points,
        formula: 'normalizedAxis = axisPoints / sum(axisPoints) * 100',
        fallback: 'if priority axis exists and no points, inject +1 to that axis'
      },
      rawSignals: {
        stats,
        flags,
        quests: safeState?.player?.quests || {}
      },
      choicesTrace,
      coverageBreakdown,
      missingSignals: {
        fixedResults: fixedResults.missing,
        minigames: minigames.enabled ? [] : [minigames.reason]
      }
    };
  }

  return report;
}
