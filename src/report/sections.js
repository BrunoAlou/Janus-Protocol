import { el, formatDurationFromMs, renderJsonBlock, renderSection } from './ui.js';

export function renderCoverageBreakdown(root, report, mode) {
  if (mode !== 'debug' || !report.coverage?.breakdown) return;

  const breakdownCard = el('section', 'card');
  const breakdownHeader = el('div', 'card-header');
  breakdownHeader.appendChild(el('h2', null, 'Composicao da Coverage'));
  breakdownCard.appendChild(breakdownHeader);

  const breakdownBody = el('div', 'card-body');
  const breakdown = report.coverage.breakdown;
  const list = el('ul');

  list.appendChild(el('li', null, `Perfil: ${breakdown.profile.available}/${breakdown.profile.total} => ${breakdown.profile.percentage}%`));
  list.appendChild(el('li', null, `Resultados fixos: ${breakdown.fixedResults.available}/${breakdown.fixedResults.total} => ${breakdown.fixedResults.percentage}%`));
  list.appendChild(el('li', null, `Minigames: ${breakdown.minigames.available}/${breakdown.minigames.total} => ${breakdown.minigames.percentage}%`));
  list.appendChild(el('li', null, `Badges (sinais): ${breakdown.badges.available}/${breakdown.badges.total} => ${breakdown.badges.percentage}%`));
  list.appendChild(el('li', null, `Global: media das 4 secoes = ${breakdown.global.rawAverage.toFixed(2)} => ${breakdown.global.rounded}%`));

  breakdownBody.appendChild(list);
  if (breakdown.minigames.reason) {
    breakdownBody.appendChild(el('p', 'muted', `Motivo minigames: ${breakdown.minigames.reason}`));
  }
  breakdownCard.appendChild(breakdownBody);
  root.appendChild(breakdownCard);
}

export function renderProfileSection(root, report, mode) {
  const sections = report.sections || {};
  renderSection(root, 'Perfil', report.coverage.bySection.profile || 0, (body) => {
    if (!sections.profile?.enabled) {
      body.appendChild(el('p', 'muted', 'Sem dados suficientes para perfil neste momento.'));
      return;
    }

    const list = el('ul');
    Object.entries(sections.profile.gpi || {}).forEach(([key, value]) => {
      list.appendChild(el('li', null, `${key}: ${value}`));
    });
    body.appendChild(list);

    const derived = sections.profile?.derived || {};
    if (Object.keys(derived).length > 0) {
      body.appendChild(el('h3', null, 'Perfil Derivado'));
      const derivedList = el('ul');
      derivedList.appendChild(el('li', null, `Dominant axis: ${derived.dominantAxis || 'n/d'}`));
      derivedList.appendChild(el('li', null, `Confidence: ${Number(derived?.confidence?.global || 0)}%`));

      const disc = derived.disc || {};
      derivedList.appendChild(el('li', null, `DISC => D:${Number(disc.D || 0).toFixed(1)} I:${Number(disc.I || 0).toFixed(1)} S:${Number(disc.S || 0).toFixed(1)} C:${Number(disc.C || 0).toFixed(1)}`));

      const bf = derived.bigFive || {};
      derivedList.appendChild(el('li', null, `Big Five => O:${Number(bf.O || 0).toFixed(2)} C:${Number(bf.C || 0).toFixed(2)} E:${Number(bf.E || 0).toFixed(2)} A:${Number(bf.A || 0).toFixed(2)} N:${Number(bf.N || 0).toFixed(2)}`));

      body.appendChild(derivedList);
    }

    if (mode === 'debug') {
      body.appendChild(el('h3', null, 'Fonte de calculo'));
      renderJsonBlock(body, sections.profile.source || {});
    }
  });
}

export function renderFixedResultsSection(root, report, mode) {
  const sections = report.sections || {};
  renderSection(root, 'Resultados Fixos', report.coverage.bySection.fixedResults || 0, (body) => {
    if (!sections.fixedResults?.enabled) {
      body.appendChild(el('p', 'muted', 'Sem metricas fixas suficientes para exibir no momento.'));
      return;
    }

    const metrics = {
      completionTimeSec: sections.fixedResults.completionTimeSec,
      interactionsCount: sections.fixedResults.interactionsCount,
      elementsUnlocked: sections.fixedResults.elementsUnlocked,
      journeysCompleted: sections.fixedResults.journeysCompleted,
      objectivesCompletionRate: sections.fixedResults.objectivesCompletionRate
    };

    const list = el('ul');
    Object.entries(metrics).forEach(([key, value]) => {
      list.appendChild(el('li', null, value === null ? `${key}: n/d` : `${key}: ${value}`));
    });
    body.appendChild(list);

    if (mode === 'debug') {
      const traceTiming = report.debug?.choicesTrace?.sessionTiming;
      if (traceTiming) {
        const timingList = el('ul');
        timingList.appendChild(el('li', null, `Sessao desde primeiro input de login: ${formatDurationFromMs(traceTiming.elapsedSinceLoginMs)}`));
        timingList.appendChild(el('li', null, `Tempo ate primeira interacao: ${formatDurationFromMs(traceTiming.timeToFirstInteractionMs)}`));
        timingList.appendChild(el('li', null, `Intervalo medio entre interacoes: ${formatDurationFromMs(traceTiming.averageGapMs)}`));
        timingList.appendChild(el('li', null, `Ultimo intervalo entre interacoes: ${formatDurationFromMs(traceTiming.lastGapMs)}`));
        timingList.appendChild(el('li', null, `Inatividade desde ultima interacao: ${formatDurationFromMs(traceTiming.idleSinceLastInteractionMs)}`));
        body.appendChild(el('h3', null, 'Tempos de sessao (debug)'));
        body.appendChild(timingList);
      }

      body.appendChild(el('h3', null, 'Missing map'));
      renderJsonBlock(body, sections.fixedResults.missing || {});
    }
  });
}

export function renderMinigamesSection(root, report, mode) {
  const sections = report.sections || {};
  if (!sections.minigames?.enabled) return;

  renderSection(root, 'Minigames', report.coverage.bySection.minigames || 0, (body) => {
    const summary = sections.minigames.summary || {};
    const list = el('ul');
    list.appendChild(el('li', null, `Unlocked: ${summary.totalUnlocked || 0}`));
    list.appendChild(el('li', null, `Attempts: ${summary.totalAttempts || 0}`));
    list.appendChild(el('li', null, `Average engagement: ${Number(summary.averageEngagement || 0).toFixed(2)}`));
    body.appendChild(list);

    if (mode === 'debug') {
      body.appendChild(el('h3', null, 'Raw minigames'));
      renderJsonBlock(body, sections.minigames.minigames || []);
    }
  });
}

export function renderBadgesSection(root, report, mode) {
  const sections = report.sections || {};
  renderSection(root, 'Badges', report.coverage.bySection.badges || 0, (body) => {
    const badges = mode === 'debug'
      ? (sections.badges?.allBadges || [])
      : (sections.badges?.badges || []);

    if (badges.length === 0) {
      body.appendChild(el('p', 'muted', 'Nenhuma badge alcancada ate o momento.'));
      return;
    }

    badges.forEach((badge) => {
      const row = el('div', 'badge-row');

      if (mode === 'debug') {
        row.appendChild(el('strong', null, `${badge.title} (${badge.earned ? 'Alcancada' : 'Nao alcancada'})`));
        row.appendChild(el('p', null, `${badge.criteria} | ${badge.evidence}`));
      } else {
        row.appendChild(el('strong', null, badge.title));
        row.appendChild(el('p', null, 'Alcancada'));
      }

      body.appendChild(row);
    });
  });
}

export function renderNarrativeAuditSection(root, report, mode) {
  const sections = report.sections || {};
  if (!sections.narrativeAudit?.enabled) return;

  renderSection(root, 'Narrative Audit', 100, (body) => {
    const audit = sections.narrativeAudit || {};
    const ending = audit.ending || {};
    const runtime = audit.runtime || {};
    const calibration = audit.profileCalibration || {};

    body.appendChild(el('h3', null, 'Ending'));
    const endingList = el('ul');
    endingList.appendChild(el('li', null, `Resolved: ${ending.resolved ? 'yes' : 'no'}`));
    endingList.appendChild(el('li', null, `Ending ID: ${ending.endingId || 'n/d'}`));
    endingList.appendChild(el('li', null, `Objective: ${ending.objective || 'n/d'}`));
    endingList.appendChild(el('li', null, `Dominant axis: ${ending.dominantAxis || 'n/d'}`));
    endingList.appendChild(el('li', null, `Tone: ${ending.tone || 'n/d'}`));
    body.appendChild(endingList);

    body.appendChild(el('h3', null, 'Runtime Narrative Signals'));
    const runtimeList = el('ul');
    runtimeList.appendChild(el('li', null, `Dilemmas resolved: ${runtime.dilemmasResolved || 0}`));
    runtimeList.appendChild(el('li', null, `Options selected: ${runtime.optionsSelected || 0}`));
    runtimeList.appendChild(el('li', null, `Journeys completed: ${runtime.journeysCompleted || 0}/${runtime.journeysTotal || 0}`));
    const impact = runtime.impactTotals || {};
    runtimeList.appendChild(el('li', null, `Impact totals => execution:${Number(impact.execution || 0)} collaboration:${Number(impact.collaboration || 0)} resilience:${Number(impact.resilience || 0)} innovation:${Number(impact.innovation || 0)}`));
    body.appendChild(runtimeList);

    body.appendChild(el('h3', null, 'Calibration'));
    const calibrationList = el('ul');
    calibrationList.appendChild(el('li', null, `Preset: ${calibration.calibrationPreset || 'default'}`));
    calibrationList.appendChild(el('li', null, `Confidence global: ${Number(calibration.confidenceGlobal || 0)}%`));
    body.appendChild(calibrationList);

    if (mode === 'debug') {
      body.appendChild(el('h3', null, 'Ending payload (raw)'));
      renderJsonBlock(body, ending.latestPayload || null);
      body.appendChild(el('h3', null, 'Ending history (raw)'));
      renderJsonBlock(body, ending.history || []);
      body.appendChild(el('h3', null, 'Runtime by source (raw)'));
      renderJsonBlock(body, runtime.bySource || {});
      body.appendChild(el('h3', null, 'Runtime by dilemma (raw)'));
      renderJsonBlock(body, runtime.byDilemma || {});
      body.appendChild(el('h3', null, 'Runtime history preview (raw)'));
      renderJsonBlock(body, runtime.historyPreview || []);
    }
  });
}

export function renderDebugDetailsSection(root, report, mode) {
  if (mode !== 'debug' || !report.debug) return;

  renderSection(root, 'Debug Details', 100, (body) => {
    const choicesTrace = report.debug.choicesTrace || {};

    body.appendChild(el('h3', null, 'Quais escolhas foram tomadas?'));
    const sequence = choicesTrace.axisChoiceSequence || 'n/d';
    body.appendChild(el('p', null, `Sequencia atual de axis: ${sequence}`));

    const axisTimeline = Array.isArray(choicesTrace.axisChoiceTimeline) ? choicesTrace.axisChoiceTimeline : [];
    const axisChain = choicesTrace.axisChoiceBlockchain || null;

    if (axisChain) {
      const chainText = axisChain.isValid
        ? `Cadeia blockchain de escolhas: valida (${axisChain.totalBlocks} blocos)`
        : `Cadeia blockchain de escolhas: invalida em indice ${axisChain.brokenAt} (${axisChain.totalBlocks} blocos)`;
      body.appendChild(el('p', null, chainText));
    }

    if (axisTimeline.length > 0) {
      const axisList = el('ul');
      axisTimeline.forEach((entry, index) => {
        const label = entry.label ? ` | opcao: ${entry.label}` : '';
        axisList.appendChild(el('li', null, `${index + 1}. ${entry.axisShort} (${entry.axis}) em ${entry.source}${label}`));
      });
      body.appendChild(axisList);
    } else {
      body.appendChild(el('p', 'muted', 'Nenhuma escolha de eixo registrada ainda.'));
    }

    if (Array.isArray(choicesTrace.recentInteractions) && choicesTrace.recentInteractions.length > 0) {
      body.appendChild(el('h3', null, 'Ultimas interacoes'));
      const interactionsList = el('ul');
      choicesTrace.recentInteractions.forEach((entry, index) => {
        interactionsList.appendChild(
          el('li', null, `${index + 1}. ${entry.elementName || entry.elementId || 'elemento'} | cena: ${entry.scene || 'n/d'} | tipo: ${entry.interactionType || 'n/d'}`)
        );
      });
      body.appendChild(interactionsList);
    }

    body.appendChild(el('h3', null, 'Escolhas e sinais coletados ate agora (raw)'));
    renderJsonBlock(body, choicesTrace);
    body.appendChild(el('h3', null, 'Como a coverage foi calculada'));
    renderJsonBlock(body, report.debug.coverageBreakdown || {});
    body.appendChild(el('h3', null, 'Sinais brutos completos'));
    renderJsonBlock(body, report.debug);
  });
}
