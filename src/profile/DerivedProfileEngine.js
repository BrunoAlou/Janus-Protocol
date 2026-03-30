import balanceConfig from '../data/config/balance-config.json';
import playtestCalibration from '../data/config/playtest-calibration.json';

const AXES = ['execution', 'collaboration', 'resilience', 'innovation'];

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getAxisPoints(state = {}) {
  const stats = state?.player?.stats || {};
  const flags = state?.player?.flags || {};

  const points = {
    execution: Number(stats.axis_points_execution || 0),
    collaboration: Number(stats.axis_points_collaboration || 0),
    resilience: Number(stats.axis_points_resilience || 0),
    innovation: Number(stats.axis_points_innovation || 0)
  };

  const priorityAxis = flags.receptionist_priority_axis;
  if (priorityAxis && AXES.includes(priorityAxis) && Object.values(points).every((value) => value === 0)) {
    points[priorityAxis] = 1;
  }

  return points;
}

function normalizeAxis(points = {}) {
  const total = AXES.reduce((acc, axis) => acc + Number(points[axis] || 0), 0);
  if (total <= 0) {
    return {
      execution: 0,
      collaboration: 0,
      resilience: 0,
      innovation: 0
    };
  }

  return {
    execution: round2((Number(points.execution || 0) / total) * 100),
    collaboration: round2((Number(points.collaboration || 0) / total) * 100),
    resilience: round2((Number(points.resilience || 0) / total) * 100),
    innovation: round2((Number(points.innovation || 0) / total) * 100)
  };
}

function deriveDisc(axisNormalized = {}) {
  const formulas = balanceConfig?.discDerivation?.formulas || {};
  const derived = {};

  Object.keys(formulas).forEach((discKey) => {
    const weights = formulas[discKey] || {};
    const traitMultiplier = Number(playtestCalibration?.disc?.traitMultipliers?.[discKey] || 1);
    const axisAdjustments = playtestCalibration?.disc?.axisWeightAdjustments?.[discKey] || {};
    const raw = AXES.reduce((acc, axis) => {
      const baseWeight = Number(weights[axis] || 0);
      const calibratedAxisWeight = baseWeight * Number(axisAdjustments[axis] || 1);
      return acc + Number(axisNormalized[axis] || 0) * calibratedAxisWeight;
    }, 0);
    derived[discKey] = round2(clamp(raw * traitMultiplier, 0, 100));
  });

  return derived;
}

function deriveBigFive(axisNormalized = {}) {
  const formulas = balanceConfig?.bigFiveDerivation?.formulas || {};
  const derived = {};
  const scaleGain = Number(playtestCalibration?.bigFive?.scaleGain || 1);
  const traitBias = playtestCalibration?.bigFive?.traitBias || {};

  Object.keys(formulas).forEach((trait) => {
    const weights = formulas[trait] || {};
    const raw = AXES.reduce((acc, axis) => {
      const weight = Number(weights[axis] || 0);
      return acc + Number(axisNormalized[axis] || 0) * weight;
    }, 0);

    const bias = Number(traitBias[trait] || 0);

    if (trait === 'N' && /invertida/i.test(String(weights.description || ''))) {
      const inverted = 100 - raw;
      const scaled = (1 + (inverted / 25)) * scaleGain + bias;
      derived[trait] = round2(clamp(scaled, 1, 5));
      return;
    }

    const scaled = (1 + (raw / 25)) * scaleGain + bias;
    derived[trait] = round2(clamp(scaled, 1, 5));
  });

  return derived;
}

function computeBalanceVariance(axisNormalized = {}) {
  const values = AXES.map((axis) => Number(axisNormalized[axis] || 0));
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance = values.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / values.length;
  const std = Math.sqrt(variance);
  return round2(std);
}

function computeTimelineConsistency(state = {}) {
  const stats = state?.player?.stats || {};
  const timeline = Array.isArray(stats.axis_choice_timeline) ? stats.axis_choice_timeline : [];
  const windowSize = Number(playtestCalibration?.confidence?.consistencyWindow || 16);
  const slice = timeline.slice(-Math.max(4, windowSize));

  if (slice.length < 2) {
    return {
      score: 50,
      switchRate: 0.5,
      transitions: 0
    };
  }

  let transitions = 0;
  let switches = 0;
  for (let i = 1; i < slice.length; i++) {
    transitions += 1;
    if (slice[i - 1]?.axis !== slice[i]?.axis) {
      switches += 1;
    }
  }

  const switchRate = transitions > 0 ? switches / transitions : 0.5;
  const score = clamp(100 - (switchRate * 100), 0, 100);

  return {
    score: Math.round(score),
    switchRate: round2(switchRate),
    transitions
  };
}

function resolveConfidenceWeights() {
  const configured = playtestCalibration?.confidence?.weights || {};
  const defaults = {
    signalVolume: 0.35,
    axisBalance: 0.2,
    dilemmaCoverage: 0.2,
    journeyCoverage: 0.15,
    objectiveCoverage: 0.1,
    consistency: 0
  };

  return {
    signalVolume: Number(configured.signalVolume ?? defaults.signalVolume),
    axisBalance: Number(configured.axisBalance ?? defaults.axisBalance),
    dilemmaCoverage: Number(configured.dilemmaCoverage ?? defaults.dilemmaCoverage),
    journeyCoverage: Number(configured.journeyCoverage ?? defaults.journeyCoverage),
    objectiveCoverage: Number(configured.objectiveCoverage ?? defaults.objectiveCoverage),
    consistency: Number(configured.consistency ?? defaults.consistency)
  };
}

function computeConfidence(state = {}, axisNormalized = {}) {
  const stats = state?.player?.stats || {};
  const flags = state?.player?.flags || {};

  const axisTimeline = Array.isArray(stats.axis_choice_timeline) ? stats.axis_choice_timeline : [];
  const signalVolume = axisTimeline.length;
  const signalVolumeTarget = Number(playtestCalibration?.confidence?.targets?.signalVolume || 40);
  const signalVolumeScore = clamp((signalVolume / signalVolumeTarget) * 100, 0, 100);

  const balanceStd = computeBalanceVariance(axisNormalized);
  const balanceScore = clamp(100 - (balanceStd * 3.2), 0, 100);

  const runtimeDilemmasCompleted = Number(stats.runtime_dilemmas_completed || 0);
  const dilemmasTarget = Number(playtestCalibration?.confidence?.targets?.runtimeDilemmas || 8);
  const dilemmaScore = clamp((runtimeDilemmasCompleted / dilemmasTarget) * 100, 0, 100);

  const runtimeJourneyRate = Number(stats.runtime_journey_completion_rate || 0);
  const journeyScore = clamp(runtimeJourneyRate, 0, 100);

  const objectiveCompleted = [
    'objective_talk_to_boss_completed',
    'objective_talk_to_team_completed',
    'objective_solve_anomaly_completed',
    'objective_stabilize_system_completed'
  ].filter((key) => flags[key] === true).length;
  const objectiveScore = clamp((objectiveCompleted / 4) * 100, 0, 100);
  const consistency = computeTimelineConsistency(state);
  const weights = resolveConfidenceWeights();

  const raw = (
    signalVolumeScore * weights.signalVolume +
    balanceScore * weights.axisBalance +
    dilemmaScore * weights.dilemmaCoverage +
    journeyScore * weights.journeyCoverage +
    objectiveScore * weights.objectiveCoverage +
    consistency.score * weights.consistency
  );

  return {
    global: Math.round(raw),
    components: {
      signalVolume: Math.round(signalVolumeScore),
      axisBalance: Math.round(balanceScore),
      dilemmaCoverage: Math.round(dilemmaScore),
      journeyCoverage: Math.round(journeyScore),
      objectiveCoverage: Math.round(objectiveScore),
      consistency: Math.round(consistency.score)
    },
    diagnostics: {
      signalVolume,
      balanceStd,
      runtimeDilemmasCompleted,
      objectiveCompleted,
      consistency,
      calibrationPreset: playtestCalibration?.meta?.presetId || 'default'
    }
  };
}

function getDominantAxis(axisNormalized = {}) {
  const entries = AXES.map((axis) => [axis, Number(axisNormalized[axis] || 0)]);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] || 'execution';
}

export function deriveProfilesFromState(state = {}) {
  const axisPoints = getAxisPoints(state);
  const axisNormalized = normalizeAxis(axisPoints);
  const disc = deriveDisc(axisNormalized);
  const bigFive = deriveBigFive(axisNormalized);
  const confidence = computeConfidence(state, axisNormalized);

  return {
    axisPoints,
    axisNormalized,
    disc,
    bigFive,
    confidence,
    dominantAxis: getDominantAxis(axisNormalized)
  };
}
