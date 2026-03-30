import dilemmasData from '../data/interactions/dilemmas.json';

const AXES = ['execution', 'collaboration', 'resilience', 'innovation'];

const RUNTIME_DILEMMA_MAP = {
  opt_info: {
    dilemmaId: 'DLM_RT_RECEPTION_ORIENTATION',
    optionId: 'DLM_RT_RECEPTION_ORIENTATION_A',
    source: 'Receptionist',
    gpiImpact: { execution: 0, collaboration: 1, resilience: 0, innovation: 1 }
  },
  opt_directions: {
    dilemmaId: 'DLM_RT_RECEPTION_ORIENTATION',
    optionId: 'DLM_RT_RECEPTION_ORIENTATION_B',
    source: 'Receptionist',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 1, innovation: 0 }
  },
  opt_meet_it_team: {
    dilemmaId: 'DLM_RT_RECEPTION_ORIENTATION',
    optionId: 'DLM_RT_RECEPTION_ORIENTATION_C',
    source: 'Receptionist',
    gpiImpact: { execution: 0, collaboration: 2, resilience: 0, innovation: 0 }
  },
  opt_meeting: {
    dilemmaId: 'DLM_RT_RECEPTION_ORIENTATION',
    optionId: 'DLM_RT_RECEPTION_ORIENTATION_D',
    source: 'Receptionist',
    gpiImpact: { execution: 1, collaboration: 1, resilience: 0, innovation: 0 }
  },
  opt_resilience_wait: {
    dilemmaId: 'DLM_RT_RECEPTION_ENTRY',
    optionId: 'DLM_RT_RECEPTION_ENTRY_A',
    source: 'Receptionist',
    gpiImpact: { execution: -1, collaboration: 0, resilience: 2, innovation: 0 }
  },
  opt_collaboration_team: {
    dilemmaId: 'DLM_RT_RECEPTION_ENTRY',
    optionId: 'DLM_RT_RECEPTION_ENTRY_B',
    source: 'Receptionist',
    gpiImpact: { execution: -1, collaboration: 2, resilience: 0, innovation: 0 }
  },
  opt_execution_form: {
    dilemmaId: 'DLM_RT_RECEPTION_ENTRY',
    optionId: 'DLM_RT_RECEPTION_ENTRY_C',
    source: 'Receptionist',
    gpiImpact: { execution: 2, collaboration: -1, resilience: 0, innovation: 0 }
  },
  opt_innovation_details: {
    dilemmaId: 'DLM_RT_RECEPTION_ENTRY',
    optionId: 'DLM_RT_RECEPTION_ENTRY_D',
    source: 'Receptionist',
    gpiImpact: { execution: 0, collaboration: 0, resilience: -1, innovation: 2 }
  },
  opt_sit_guy_vaga_info: {
    dilemmaId: 'DLM_RT_PEER_PREP',
    optionId: 'DLM_RT_PEER_PREP_A',
    source: 'Caio',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: 0 }
  },
  opt_sit_guy_apresentacao: {
    dilemmaId: 'DLM_RT_PEER_PREP',
    optionId: 'DLM_RT_PEER_PREP_B',
    source: 'Caio',
    gpiImpact: { execution: 0, collaboration: 1, resilience: 0, innovation: 0 }
  },
  opt_sit_guy_atraso: {
    dilemmaId: 'DLM_RT_PEER_PREP',
    optionId: 'DLM_RT_PEER_PREP_C',
    source: 'Caio',
    gpiImpact: { execution: 0, collaboration: 0, resilience: 1, innovation: 0 }
  },
  opt_sit_guy_fluxo: {
    dilemmaId: 'DLM_RT_PEER_PREP',
    optionId: 'DLM_RT_PEER_PREP_D',
    source: 'Caio',
    gpiImpact: { execution: 0, collaboration: 0, resilience: 0, innovation: 1 }
  },
  opt_sit_guy_queue: {
    dilemmaId: 'DLM_RT_PEER_WARMUP',
    optionId: 'DLM_RT_PEER_WARMUP_A',
    source: 'Caio',
    gpiImpact: { execution: 0, collaboration: 1, resilience: 1, innovation: 0 }
  },
  opt_sit_guy_bye: {
    dilemmaId: 'DLM_RT_PEER_WARMUP',
    optionId: 'DLM_RT_PEER_WARMUP_B',
    source: 'Caio',
    gpiImpact: { execution: 0, collaboration: 1, resilience: 0, innovation: 0 }
  },
  opt_map: {
    dilemmaId: 'DLM_RT_TERMINAL_RESEARCH',
    optionId: 'DLM_RT_TERMINAL_RESEARCH_A',
    source: 'Terminal de Informacoes',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: 1 }
  },
  opt_directory: {
    dilemmaId: 'DLM_RT_TERMINAL_RESEARCH',
    optionId: 'DLM_RT_TERMINAL_RESEARCH_B',
    source: 'Terminal de Informacoes',
    gpiImpact: { execution: 0, collaboration: 2, resilience: 0, innovation: 0 }
  },
  opt_quiz: {
    dilemmaId: 'DLM_RT_TERMINAL_RESEARCH',
    optionId: 'DLM_RT_TERMINAL_RESEARCH_C',
    source: 'Terminal de Informacoes',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 1, innovation: 0 }
  },
  opt_news: {
    dilemmaId: 'DLM_RT_BULLETIN_SCAN',
    optionId: 'DLM_RT_BULLETIN_SCAN_A',
    source: 'Painel de Avisos',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: 0 }
  },
  opt_rules: {
    dilemmaId: 'DLM_RT_BULLETIN_SCAN',
    optionId: 'DLM_RT_BULLETIN_SCAN_B',
    source: 'Painel de Avisos',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 1, innovation: 0 }
  },
  opt_events: {
    dilemmaId: 'DLM_RT_BULLETIN_SCAN',
    optionId: 'DLM_RT_BULLETIN_SCAN_C',
    source: 'Painel de Avisos',
    gpiImpact: { execution: 0, collaboration: 1, resilience: 0, innovation: 1 }
  },
  opt_magazine_resilience_01: {
    dilemmaId: 'DLM_RT_MAGAZINE_SCAN',
    optionId: 'DLM_RT_MAGAZINE_SCAN_A',
    source: 'Stand de Revistas',
    gpiImpact: { execution: 0, collaboration: 0, resilience: 1, innovation: 0 }
  },
  opt_magazine_collaboration_01: {
    dilemmaId: 'DLM_RT_MAGAZINE_SCAN',
    optionId: 'DLM_RT_MAGAZINE_SCAN_B',
    source: 'Stand de Revistas',
    gpiImpact: { execution: 0, collaboration: 1, resilience: 0, innovation: 0 }
  },
  opt_magazine_execution_01: {
    dilemmaId: 'DLM_RT_MAGAZINE_SCAN',
    optionId: 'DLM_RT_MAGAZINE_SCAN_C',
    source: 'Stand de Revistas',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: 0 }
  },
  opt_magazine_innovation_01: {
    dilemmaId: 'DLM_RT_MAGAZINE_SCAN',
    optionId: 'DLM_RT_MAGAZINE_SCAN_D',
    source: 'Stand de Revistas',
    gpiImpact: { execution: 0, collaboration: 0, resilience: 0, innovation: 1 }
  },
  opt_magazine_collaboration_02: {
    dilemmaId: 'DLM_RT_MAGAZINE_SCAN',
    optionId: 'DLM_RT_MAGAZINE_SCAN_E',
    source: 'Stand de Revistas',
    gpiImpact: { execution: 0, collaboration: 1, resilience: 0, innovation: 0 }
  },
  opt_magazine_execution_02: {
    dilemmaId: 'DLM_RT_MAGAZINE_SCAN',
    optionId: 'DLM_RT_MAGAZINE_SCAN_F',
    source: 'Stand de Revistas',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: 0 }
  },
  opt_archive_info_1: {
    dilemmaId: 'DLM_RT_ARCHIVE_PROTOCOL',
    optionId: 'DLM_RT_ARCHIVE_PROTOCOL_A',
    source: 'Arquivista Ana',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: 0 }
  },
  opt_archive_find_1: {
    dilemmaId: 'DLM_RT_ARCHIVE_PROTOCOL',
    optionId: 'DLM_RT_ARCHIVE_PROTOCOL_B',
    source: 'Arquivista Ana',
    gpiImpact: { execution: 1, collaboration: 1, resilience: 0, innovation: 0 }
  },
  opt_archive_rules_1: {
    dilemmaId: 'DLM_RT_ARCHIVE_PROTOCOL',
    optionId: 'DLM_RT_ARCHIVE_PROTOCOL_C',
    source: 'Arquivista Ana',
    gpiImpact: { execution: 0, collaboration: 0, resilience: 1, innovation: 0 }
  },
  opt_archive_info_2: {
    dilemmaId: 'DLM_RT_ARCHIVE_PROTOCOL',
    optionId: 'DLM_RT_ARCHIVE_PROTOCOL_D',
    source: 'Arquivista Marina',
    gpiImpact: { execution: 0, collaboration: 1, resilience: 0, innovation: 1 }
  },
  opt_archive_find_2: {
    dilemmaId: 'DLM_RT_ARCHIVE_PROTOCOL',
    optionId: 'DLM_RT_ARCHIVE_PROTOCOL_E',
    source: 'Arquivista Marina',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: 1 }
  },
  opt_archive_rules_2: {
    dilemmaId: 'DLM_RT_ARCHIVE_PROTOCOL',
    optionId: 'DLM_RT_ARCHIVE_PROTOCOL_F',
    source: 'Arquivista Marina',
    gpiImpact: { execution: 0, collaboration: 0, resilience: 1, innovation: 0 }
  },
  opt_boss_project: {
    dilemmaId: 'DLM_RT_BOSS_ALIGNMENT',
    optionId: 'DLM_RT_BOSS_ALIGNMENT_A',
    source: 'Chefe',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: 2 }
  },
  opt_boss_career: {
    dilemmaId: 'DLM_RT_BOSS_ALIGNMENT',
    optionId: 'DLM_RT_BOSS_ALIGNMENT_B',
    source: 'Chefe',
    gpiImpact: { execution: 1, collaboration: 1, resilience: 1, innovation: 0 }
  },
  q1_a: {
    dilemmaId: 'DLM_RT_JANUS_Q1',
    optionId: 'DLM_RT_JANUS_Q1_A',
    source: 'Janus IA',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 0, innovation: -1 }
  },
  q1_b: {
    dilemmaId: 'DLM_RT_JANUS_Q1',
    optionId: 'DLM_RT_JANUS_Q1_B',
    source: 'Janus IA',
    gpiImpact: { execution: -1, collaboration: 1, resilience: 0, innovation: 0 }
  },
  q1_c: {
    dilemmaId: 'DLM_RT_JANUS_Q1',
    optionId: 'DLM_RT_JANUS_Q1_C',
    source: 'Janus IA',
    gpiImpact: { execution: 0, collaboration: 0, resilience: -1, innovation: 1 }
  },
  q1_d: {
    dilemmaId: 'DLM_RT_JANUS_Q1',
    optionId: 'DLM_RT_JANUS_Q1_D',
    source: 'Janus IA',
    gpiImpact: { execution: 0, collaboration: 0, resilience: 1, innovation: -1 }
  },
  q2_a: {
    dilemmaId: 'DLM_RT_JANUS_Q2',
    optionId: 'DLM_RT_JANUS_Q2_A',
    source: 'Janus IA',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 1, innovation: -1 }
  },
  q2_b: {
    dilemmaId: 'DLM_RT_JANUS_Q2',
    optionId: 'DLM_RT_JANUS_Q2_B',
    source: 'Janus IA',
    gpiImpact: { execution: -1, collaboration: 1, resilience: 0, innovation: 0 }
  },
  q2_c: {
    dilemmaId: 'DLM_RT_JANUS_Q2',
    optionId: 'DLM_RT_JANUS_Q2_C',
    source: 'Janus IA',
    gpiImpact: { execution: 0, collaboration: 0, resilience: -1, innovation: 1 }
  },
  q2_d: {
    dilemmaId: 'DLM_RT_JANUS_Q2',
    optionId: 'DLM_RT_JANUS_Q2_D',
    source: 'Janus IA',
    gpiImpact: { execution: 1, collaboration: 0, resilience: 1, innovation: -1 }
  },
  objective_choose_boss: {
    dilemmaId: 'DLM_RT_PRIMARY_OBJECTIVE',
    optionId: 'DLM_RT_PRIMARY_OBJECTIVE_A',
    source: 'Janus IA',
    gpiImpact: { execution: 2, collaboration: -1, resilience: 0, innovation: 0 }
  },
  objective_choose_team: {
    dilemmaId: 'DLM_RT_PRIMARY_OBJECTIVE',
    optionId: 'DLM_RT_PRIMARY_OBJECTIVE_B',
    source: 'Janus IA',
    gpiImpact: { execution: -1, collaboration: 2, resilience: 0, innovation: 0 }
  },
  objective_choose_solve: {
    dilemmaId: 'DLM_RT_PRIMARY_OBJECTIVE',
    optionId: 'DLM_RT_PRIMARY_OBJECTIVE_C',
    source: 'Janus IA',
    gpiImpact: { execution: 0, collaboration: 0, resilience: -1, innovation: 2 }
  },
  objective_choose_stabilize: {
    dilemmaId: 'DLM_RT_PRIMARY_OBJECTIVE',
    optionId: 'DLM_RT_PRIMARY_OBJECTIVE_D',
    source: 'Janus IA',
    gpiImpact: { execution: 0, collaboration: 0, resilience: 2, innovation: -1 }
  }
};

const DYNAMIC_LIKERT_QUESTION_AXES = {
  q3: { positive: 'execution', negative: 'innovation' },
  q4: { positive: 'collaboration', negative: 'execution' },
  q5: { positive: 'resilience', negative: 'innovation' }
};

const DYNAMIC_LIKERT_INTENSITY = {
  strongly_agree: 2,
  agree: 1,
  neutral: 0,
  disagree: 1,
  strongly_disagree: 2
};

function createAxisImpact(primaryAxis, secondaryAxis, intensity = 1) {
  const safeIntensity = Number(intensity || 0);
  const impact = {
    execution: 0,
    collaboration: 0,
    resilience: 0,
    innovation: 0
  };

  if (!primaryAxis || !AXES.includes(primaryAxis) || safeIntensity <= 0) {
    return impact;
  }

  impact[primaryAxis] = safeIntensity;

  if (secondaryAxis && AXES.includes(secondaryAxis)) {
    impact[secondaryAxis] = -Math.max(1, safeIntensity - 1);
  }

  return impact;
}

function buildDynamicLikertEntry(optionId) {
  const match = /^q([3-5])_(strongly_agree|agree|neutral|disagree|strongly_disagree)$/.exec(optionId || '');
  if (!match) return null;

  const questionKey = `q${match[1]}`;
  const answerKey = match[2];
  const axes = DYNAMIC_LIKERT_QUESTION_AXES[questionKey];
  if (!axes) return null;

  const intensity = Number(DYNAMIC_LIKERT_INTENSITY[answerKey] || 0);
  const agreesWithPrompt = answerKey === 'strongly_agree' || answerKey === 'agree' || answerKey === 'neutral';
  const chosenAxis = agreesWithPrompt ? axes.positive : axes.negative;
  const oppositeAxis = agreesWithPrompt ? axes.negative : axes.positive;

  return {
    dilemmaId: `DLM_RT_JANUS_${questionKey.toUpperCase()}`,
    optionId: `DLM_RT_JANUS_${questionKey.toUpperCase()}_${answerKey.toUpperCase()}`,
    source: 'Janus IA',
    gpiImpact: createAxisImpact(chosenAxis, oppositeAxis, intensity)
  };
}

const RUNTIME_JOURNEYS = [
  {
    id: 'JR_RT_001_ONBOARDING',
    name: 'Onboarding da Recepcao',
    conditions: [
      (state) => !!state?.player?.flags?.contacted_npc_receptionist,
      (state) => {
        const selected = state?.player?.flags?.receptionist_selected_options;
        return typeof selected === 'string' && selected.length > 0;
      }
    ]
  },
  {
    id: 'JR_RT_002_JANUS_CALIBRATION',
    name: 'Calibracao Janus',
    conditions: [
      (state) => state?.player?.flags?.elevator_janus_assessment_completed === true,
      (state) => !!state?.player?.flags?.elevator_primary_objective_choice
    ]
  },
  {
    id: 'JR_RT_003_TI_ALIGNMENT',
    name: 'Alinhamento TI',
    conditions: [
      (state) => state?.player?.flags?.ti_axis_journey_completed === true
    ]
  },
  {
    id: 'JR_RT_003B_ARCHIVE_PROTOCOL',
    name: 'Protocolo de Arquivo',
    conditions: [
      (state) => {
        const history = Array.isArray(state?.player?.stats?.runtime_dilemma_history)
          ? state.player.stats.runtime_dilemma_history
          : [];
        return history.some((item) => item?.dilemmaId === 'DLM_RT_ARCHIVE_PROTOCOL');
      }
    ]
  },
  {
    id: 'JR_RT_004_OBJECTIVE_RESOLUTION',
    name: 'Resolucao de Objetivo Primario',
    conditions: [
      (state) => {
        const flags = state?.player?.flags || {};
        return [
          'objective_talk_to_boss_completed',
          'objective_talk_to_team_completed',
          'objective_solve_anomaly_completed',
          'objective_stabilize_system_completed'
        ].some((key) => flags[key] === true);
      }
    ]
  },
  {
    id: 'JR_RT_005_EXECUTIVE_ALIGNMENT',
    name: 'Alinhamento Executivo',
    conditions: [
      (state) => {
        const history = Array.isArray(state?.player?.stats?.runtime_dilemma_history)
          ? state.player.stats.runtime_dilemma_history
          : [];
        return history.some((item) => item?.dilemmaId === 'DLM_RT_BOSS_ALIGNMENT');
      }
    ]
  }
];

function cloneImpact(impact = {}) {
  return {
    execution: Number(impact.execution || 0),
    collaboration: Number(impact.collaboration || 0),
    resilience: Number(impact.resilience || 0),
    innovation: Number(impact.innovation || 0)
  };
}

function getRuntimeDilemmaEntry(optionId) {
  if (!optionId || typeof optionId !== 'string') return null;
  const exact = RUNTIME_DILEMMA_MAP[optionId] || null;
  if (exact) return exact;

  return buildDynamicLikertEntry(optionId);
}

function getMappedDilemmaCount() {
  const staticCount = new Set(Object.values(RUNTIME_DILEMMA_MAP).map((item) => item?.dilemmaId).filter(Boolean)).size;
  const dynamicLikertCount = Object.keys(DYNAMIC_LIKERT_QUESTION_AXES).length;
  return staticCount + dynamicLikertCount;
}

function getObjectiveCompletionRate(flags = {}) {
  const keys = [
    'objective_talk_to_boss_completed',
    'objective_talk_to_team_completed',
    'objective_solve_anomaly_completed',
    'objective_stabilize_system_completed'
  ];
  const completed = keys.filter((key) => flags[key] === true).length;
  return Math.round((completed / keys.length) * 100);
}

export default class DilemmaJourneyRuntime {
  constructor(gameState) {
    this.gameState = gameState;
  }

  recordOptionSelection(entry = {}) {
    const optionId = entry?.optionId;
    const runtimeEntry = getRuntimeDilemmaEntry(optionId);
    if (!runtimeEntry) {
      return null;
    }

    const state = this.gameState?.getState?.();
    const stats = state?.player?.stats || {};
    const history = Array.isArray(stats.runtime_dilemma_history)
      ? [...stats.runtime_dilemma_history]
      : [];

    const exists = history.some((item) => item?.optionId === runtimeEntry.optionId);
    if (!exists) {
      const record = {
        dilemmaId: runtimeEntry.dilemmaId,
        optionId: runtimeEntry.optionId,
        sourceId: entry?.sourceId || entry?.source || runtimeEntry.source,
        label: entry?.label || null,
        scene: entry?.scene || null,
        at: Number(entry?.at || Date.now()),
        gpiImpact: cloneImpact(runtimeEntry.gpiImpact)
      };
      history.push(record);

      this.gameState.setState({
        player: {
          ...(state?.player || {}),
          stats: {
            ...stats,
            runtime_dilemma_history: history.slice(-200)
          }
        }
      });
      this.gameState.saveProgress?.();

      this._applyGpiImpact(runtimeEntry.gpiImpact, runtimeEntry.optionId);
      this.gameState.setFlag?.(`runtime_dilemma_${runtimeEntry.dilemmaId}_resolved`, true);
      this.gameState.setFlag?.(`runtime_dilemma_${runtimeEntry.dilemmaId}_choice`, runtimeEntry.optionId);
    }

    this.syncJourneys();
    return runtimeEntry;
  }

  _applyGpiImpact(gpiImpact = {}, sourceOptionId = null) {
    AXES.forEach((axis) => {
      const delta = Number(gpiImpact[axis] || 0);
      if (!Number.isFinite(delta) || delta === 0) return;

      const statKey = `axis_points_${axis}`;
      const current = Number(this.gameState.getStat?.(statKey) || 0);
      this.gameState.setStat?.(statKey, current + delta);

      this.gameState.appendAxisChoiceEntry?.({
        axis,
        source: 'Runtime Dilemma Impact',
        sourceId: sourceOptionId || 'runtime_dilemma',
        label: `${statKey} ${(delta > 0 ? '+' : '') + delta}`,
        optionId: sourceOptionId,
        scene: this.gameState.getCurrentScene?.() || null,
        influenceType: 'runtime_dilemma_impact'
      });
    });
  }

  syncJourneys() {
    const state = this.gameState?.getState?.();
    if (!state?.player) return;

    let completedCount = 0;
    RUNTIME_JOURNEYS.forEach((journey) => {
      const done = journey.conditions.every((predicate) => {
        try {
          return predicate(state) === true;
        } catch {
          return false;
        }
      });

      if (done) {
        completedCount += 1;
      }

      const questStatus = done ? 'completed' : 'started';
      this.gameState.setQuestStatus?.(journey.id, questStatus);
      this.gameState.setFlag?.(`runtime_journey_${journey.id}_completed`, done);
    });

    const completionRate = Math.round((completedCount / RUNTIME_JOURNEYS.length) * 100);
    this.gameState.setStat?.('runtime_journey_completion_rate', completionRate);

    const flags = state?.player?.flags || {};
    this.gameState.setStat?.('objective_completion_rate', getObjectiveCompletionRate(flags));

    const dilemmaHistory = Array.isArray(state?.player?.stats?.runtime_dilemma_history)
      ? state.player.stats.runtime_dilemma_history
      : [];
    const uniqueDilemmas = new Set(dilemmaHistory.map((item) => item?.dilemmaId).filter(Boolean));
    this.gameState.setStat?.('runtime_dilemmas_completed', uniqueDilemmas.size);
  }

  buildRuntimeSummary(state = null) {
    const safeState = state || this.gameState?.getState?.() || {};
    const stats = safeState?.player?.stats || {};

    const history = Array.isArray(stats.runtime_dilemma_history)
      ? stats.runtime_dilemma_history
      : [];

    const uniqueDilemmas = new Set(history.map((item) => item?.dilemmaId).filter(Boolean));
    const uniqueOptions = new Set(history.map((item) => item?.optionId).filter(Boolean));
    const impacts = history.reduce((acc, item) => {
      AXES.forEach((axis) => {
        acc[axis] += Number(item?.gpiImpact?.[axis] || 0);
      });
      return acc;
    }, {
      execution: 0,
      collaboration: 0,
      resilience: 0,
      innovation: 0
    });

    const bySource = history.reduce((acc, item) => {
      const source = String(item?.sourceId || 'unknown');
      acc[source] = Number(acc[source] || 0) + 1;
      return acc;
    }, {});

    const byDilemma = history.reduce((acc, item) => {
      const dilemmaId = String(item?.dilemmaId || 'unknown');
      acc[dilemmaId] = Number(acc[dilemmaId] || 0) + 1;
      return acc;
    }, {});

    const blueprintDilemmasTotal = Array.isArray(dilemmasData?.dilemmas) ? dilemmasData.dilemmas.length : 0;

    const completedJourneys = RUNTIME_JOURNEYS.filter((journey) =>
      safeState?.player?.flags?.[`runtime_journey_${journey.id}_completed`] === true
    ).length;

    return {
      runtimeDilemmas: {
        resolved: uniqueDilemmas.size,
        selectedOptions: uniqueOptions.size,
        totalMapped: getMappedDilemmaCount(),
        blueprintDilemmasTotal
      },
      runtimeJourneys: {
        completed: completedJourneys,
        total: RUNTIME_JOURNEYS.length
      },
      impactTotals: impacts,
      bySource,
      byDilemma,
      history
    };
  }
}
