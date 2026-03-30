import { deriveProfilesFromState } from '../profile/DerivedProfileEngine.js';

const OBJECTIVE_MATRIX = {
  boss: 'objective_talk_to_boss_completed',
  team: 'objective_talk_to_team_completed',
  solve: 'objective_solve_anomaly_completed',
  stabilize: 'objective_stabilize_system_completed'
};

function getCompletedObjective(flags = {}) {
  const entry = Object.entries(OBJECTIVE_MATRIX).find(([, key]) => flags[key] === true);
  return entry ? entry[0] : null;
}

function getToneByConfidence(confidence = 0) {
  if (confidence >= 75) return 'solid';
  if (confidence >= 45) return 'adaptive';
  return 'volatile';
}

function buildNarrative(objective, dominantAxis, tone) {
  const objectiveLabel = {
    boss: 'Confronto com a Diretoria',
    team: 'Alinhamento com a Equipe',
    solve: 'Solucao Tecnica da Anomalia',
    stabilize: 'Contencao e Estabilidade'
  }[objective] || 'Desfecho Emergente';

  const axisLabel = {
    execution: 'Execucao',
    collaboration: 'Colaboracao',
    resilience: 'Resiliencia',
    innovation: 'Inovacao'
  }[dominantAxis] || 'Execucao';

  const toneLabel = {
    solid: 'consistente',
    adaptive: 'adaptativo',
    volatile: 'reativo'
  }[tone] || 'adaptativo';

  return {
    title: `${objectiveLabel} - Perfil ${axisLabel}`,
    summary: `Voce concluiu a rota principal com assinatura ${axisLabel.toLowerCase()} e comportamento ${toneLabel}.`,
    dialogues: [
      `Desfecho identificado: ${objectiveLabel}.`,
      `Eixo dominante no ciclo final: ${axisLabel}.`,
      `Padrao comportamental observado: ${toneLabel}.`,
      'A Janus IA registra seu perfil como referencia para os proximos protocolos.'
    ]
  };
}

export function resolveEndingFromState(state = {}) {
  const flags = state?.player?.flags || {};
  if (flags.ending_resolved === true) {
    return null;
  }

  const completedObjective = getCompletedObjective(flags);
  if (!completedObjective) {
    return null;
  }

  const derived = deriveProfilesFromState(state);
  const dominantAxis = derived.dominantAxis;
  const tone = getToneByConfidence(Number(derived?.confidence?.global || 0));
  const narrative = buildNarrative(completedObjective, dominantAxis, tone);

  return {
    endingId: `ending_${completedObjective}_${dominantAxis}_${tone}`,
    objective: completedObjective,
    dominantAxis,
    tone,
    confidence: derived?.confidence?.global || 0,
    ...narrative
  };
}

export function applyEndingToGameState(gameState, endingResult) {
  if (!gameState || !endingResult) return false;

  const resolvedAt = Date.now();
  const endingPayload = {
    ...endingResult,
    resolvedAt
  };

  const existingHistory = gameState.getStat?.('ending_history');
  const history = Array.isArray(existingHistory) ? existingHistory.slice(-19) : [];
  history.push(endingPayload);

  gameState.setFlag?.('ending_resolved', true);
  gameState.setFlag?.('ending_id', endingResult.endingId);
  gameState.setFlag?.('ending_objective', endingResult.objective);
  gameState.setFlag?.('ending_dominant_axis', endingResult.dominantAxis);
  gameState.setFlag?.('ending_tone', endingResult.tone);
  gameState.setFlag?.('ending_resolved_at_ms', resolvedAt);
  gameState.setQuestStatus?.('JR_RT_999_ENDING_RESOLVED', 'completed');
  gameState.setStat?.('ending_payload', endingPayload);
  gameState.setStat?.('ending_history', history);

  return true;
}
