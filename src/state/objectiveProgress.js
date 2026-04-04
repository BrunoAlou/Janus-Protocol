const OBJECTIVES = Object.freeze([
  {
    id: 'boss',
    activeFlag: 'objective_talk_to_boss_active',
    completedFlag: 'objective_talk_to_boss_completed',
    requiredFlags: ['objective_talk_to_boss_evidence']
  },
  {
    id: 'team',
    activeFlag: 'objective_talk_to_team_active',
    completedFlag: 'objective_talk_to_team_completed',
    requiredFlags: ['objective_talk_to_team_evidence']
  },
  {
    id: 'solve',
    activeFlag: 'objective_solve_anomaly_active',
    completedFlag: 'objective_solve_anomaly_completed',
    requiredFlags: [
      'objective_solve_challenge_success',
      'checkpoint_archive_room_visited',
      'checkpoint_it_room_visited'
    ]
  },
  {
    id: 'stabilize',
    activeFlag: 'objective_stabilize_system_active',
    completedFlag: 'objective_stabilize_system_completed',
    requiredFlags: [
      'objective_stabilize_challenge_success',
      'checkpoint_garden_visited',
      'checkpoint_reception_visited'
    ]
  }
]);

export const ENDGAME_LOCK_FLAG = 'janus_endgame_locked';

function hasGameStateAccess(gameState) {
  return !!gameState && typeof gameState.getFlag === 'function' && typeof gameState.setFlag === 'function';
}

function getObjectiveById(objectiveId) {
  return OBJECTIVES.find((objective) => objective.id === objectiveId) || null;
}

function getCompletedList(gameState) {
  if (!gameState || typeof gameState.getFlag !== 'function') {
    return [];
  }

  return OBJECTIVES
    .filter((objective) => gameState.getFlag(objective.completedFlag) === true)
    .map((objective) => objective.id);
}

export function countCompletedObjectives(gameState) {
  return getCompletedList(gameState).length;
}

export function hasAtLeastCompletedObjectives(gameState, minimum) {
  return countCompletedObjectives(gameState) >= Number(minimum || 0);
}

export function isReportUnlocked(gameState, minimumCompleted = 2) {
  return hasAtLeastCompletedObjectives(gameState, minimumCompleted);
}

export function isFinalizationUnlocked(gameState, minimumCompleted = 4) {
  return hasAtLeastCompletedObjectives(gameState, minimumCompleted);
}

export function isEndgameLocked(gameState) {
  return gameState?.getFlag?.(ENDGAME_LOCK_FLAG) === true;
}

export function markObjectiveEvidence(gameState, objectiveId, value = true) {
  if (!hasGameStateAccess(gameState)) {
    return;
  }

  const objective = getObjectiveById(objectiveId);
  if (!objective?.requiredFlags?.length) {
    return;
  }

  const firstRequiredFlag = objective.requiredFlags[0];
  gameState.setFlag(firstRequiredFlag, value === true);
}

export function syncObjectiveProgress(gameState) {
  if (!hasGameStateAccess(gameState)) {
    return {
      completedCount: 0,
      newlyCompleted: []
    };
  }

  const newlyCompleted = [];

  OBJECTIVES.forEach((objective) => {
    const active = gameState.getFlag(objective.activeFlag) === true;
    const completed = gameState.getFlag(objective.completedFlag) === true;

    if (completed && active) {
      gameState.setFlag(objective.activeFlag, false);
      return;
    }

    if (!active || completed) {
      return;
    }

    const allRequirementsMet = objective.requiredFlags.every((flag) => gameState.getFlag(flag) === true);
    if (!allRequirementsMet) {
      return;
    }

    gameState.setFlag(objective.activeFlag, false);
    gameState.setFlag(objective.completedFlag, true);
    newlyCompleted.push(objective.id);
  });

  return {
    completedCount: countCompletedObjectives(gameState),
    newlyCompleted
  };
}
