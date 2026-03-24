import { SCENE_NAMES } from '../../constants/SceneNames.js';

export function getAvailableOptions(element) {
  return element.options.map((option) => {
    const available = checkCondition(element, option.condition);
    return {
      ...option,
      disabled: option.disabled || !available,
      disabledReason: !available ? 'Condição não atendida' : option.disabledReason
    };
  });
}

export function checkCondition(element, condition) {
  if (!condition) return true;

  const gameState = window.gameState;
  if (!gameState) return true;

  const { type, id, operator, value } = condition;

  switch (type) {
    case 'quest':
      return checkQuestCondition(gameState, id, operator, value);
    case 'item':
      return checkItemCondition(gameState, id, operator, value);
    case 'flag':
      return checkFlagCondition(gameState, id, operator, value);
    case 'stat':
      return checkStatCondition(gameState, id, operator, value);
    default:
      return true;
  }
}

export function checkQuestCondition(gameState, id, operator, value) {
  const questStatus = gameState.getQuestStatus?.(id);
  return compareValues(questStatus, operator, value);
}

export function checkItemCondition(gameState, id, operator, value) {
  const hasItem = gameState.hasItem?.(id);
  if (operator === 'has') return hasItem;
  if (operator === '!has') return !hasItem;
  return compareValues(gameState.getItemCount?.(id) || 0, operator, value);
}

export function checkFlagCondition(gameState, id, operator, value) {
  const flagValue = gameState.getFlag?.(id);
  return compareValues(flagValue, operator, value);
}

export function checkStatCondition(gameState, id, operator, value) {
  const statValue = gameState.getStat?.(id) || 0;
  return compareValues(statValue, operator, value);
}

export function compareValues(a, operator, b) {
  switch (operator) {
    case '==': return a == b;
    case '!=': return a != b;
    case '>': return a > b;
    case '<': return a < b;
    case '>=': return a >= b;
    case '<=': return a <= b;
    default: return a == b;
  }
}

export function executeAction(element, action, option = null) {
  if (!action) return;

  switch (action.type) {
    case 'dialog':
      executeDialogAction(element, action);
      break;
    case 'scene':
      executeSceneAction(element, action);
      break;
    case 'minigame':
      executeMinigameAction(element, action);
      break;
    case 'event':
      executeEventAction(element, action, option);
      break;
    case 'item':
      executeItemAction(element, action);
      break;
    case 'quest':
      executeQuestAction(element, action);
      break;
    case 'custom':
      executeCustomAction(element, action, option);
      break;
    default:
      console.warn(`[InteractiveElement] Unknown action type: ${action.type}`);
  }
}

export function executeDialogAction(element, action) {
  const dialogData = {
    name: element.name,
    dialogues: action.data?.dialogues || [{ text: action.target }],
    onComplete: () => element.endInteraction()
  };

  const dialogScene = element.scene.scene.get(SCENE_NAMES.DIALOG);
  if (dialogScene) {
    dialogScene.showDialog(dialogData);
  } else {
    element.scene.events.emit('npc-interact', dialogData);
  }
}

export function executeSceneAction(element, action) {
  element.endInteraction();

  const sceneKey = action.target;
  const sceneData = action.data || {};

  if (window.sceneManager) {
    window.sceneManager.goToMap(sceneKey, sceneData);
  } else {
    element.scene.scene.start(sceneKey, sceneData);
  }
}

export function executeMinigameAction(element, action) {
  const minigameKey = action.target;

  if (window.minigameManager?.unlock) {
    window.minigameManager.unlock(minigameKey, {
      source: 'interactive-element',
      elementId: element.id,
      scene: element.scene?.scene?.key || null
    });
    window.minigameManager.syncWithGameState?.();
  }

  const minigameData = {
    ...action.data,
    returnScene: element.scene.scene.key,
    elementId: element.id,
    onComplete: (result) => {
      element.scene.events.emit('minigame-complete', {
        elementId: element.id,
        minigame: minigameKey,
        result
      });
    }
  };

  if (window.sceneManager) {
    window.sceneManager.startMinigame(minigameKey, minigameData);
  } else {
    element.scene.scene.launch(minigameKey, minigameData);
  }
}

export function executeEventAction(element, action, option) {
  const eventName = action.target;
  const eventData = {
    ...action.data,
    elementId: element.id,
    elementName: element.name,
    option
  };

  element.scene.events.emit(eventName, eventData);

  if (window.gameEvents) {
    window.gameEvents.emit(eventName, eventData);
  }
}

export function executeItemAction(element, action) {
  const itemId = action.target;
  const quantity = action.data?.quantity || 1;
  const remove = action.data?.remove || false;

  if (window.gameState) {
    if (remove) {
      window.gameState.removeItem(itemId, quantity);
    } else {
      window.gameState.addItem(itemId, quantity);
    }
  }

  element.scene.events.emit('item-acquired', {
    itemId,
    quantity,
    removed: remove,
    elementId: element.id
  });
}

export function executeQuestAction(element, action) {
  const questId = action.target;
  const status = action.data?.status || 'started';

  if (window.gameState) {
    window.gameState.setQuestStatus(questId, status);
  }

  element.scene.events.emit('quest-updated', {
    questId,
    status,
    elementId: element.id
  });
}

export function executeCustomAction(element, action, option) {
  if (typeof action.data?.callback === 'function') {
    action.data.callback({
      element,
      option,
      scene: element.scene
    });
  }
}
