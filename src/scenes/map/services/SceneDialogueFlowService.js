export class SceneDialogueFlowService {
  constructor(scene) {
    this.scene = scene;
  }

  ensureDialogScene(dialogSceneKey, maxAttempts = 0, attempt = 0, onReady = null) {
    const dialogScene = this.scene.scene.get(dialogSceneKey);
    const active = this.scene.scene.isActive(dialogSceneKey);

    if (dialogScene && active) {
      if (typeof onReady === 'function') {
        onReady(dialogScene);
      }
      return true;
    }

    if (!active) {
      this.scene.scene.launch(dialogSceneKey);
    }

    if (attempt >= maxAttempts) {
      return false;
    }

    this.scene.time.delayedCall(120, () => {
      this.ensureDialogScene(dialogSceneKey, maxAttempts, attempt + 1, onReady);
    });

    return false;
  }

  showDialog(dialogSceneKey, payload) {
    const dialogScene = this.scene.scene.get(dialogSceneKey);
    if (!dialogScene || typeof dialogScene.showDialog !== 'function') {
      return false;
    }

    if (this.scene.scene.isActive(dialogSceneKey)) {
      dialogScene.showDialog(payload);
      return true;
    }

    // Evita race condition: aguarda DialogScene estar ativa/criada antes de invocar UI.
    this.ensureDialogScene(dialogSceneKey, 8, 0, () => {
      const readyScene = this.scene.scene.get(dialogSceneKey);
      if (readyScene && typeof readyScene.showDialog === 'function') {
        readyScene.showDialog(payload);
      }
    });

    return false;
  }

  showOptionsDialog(dialogSceneKey, payload) {
    const dialogScene = this.scene.scene.get(dialogSceneKey);
    if (!dialogScene || typeof dialogScene.showOptionsDialog !== 'function') {
      return false;
    }

    if (this.scene.scene.isActive(dialogSceneKey)) {
      dialogScene.showOptionsDialog(payload);
      return true;
    }

    // Evita race condition: aguarda DialogScene estar ativa/criada antes de invocar UI.
    this.ensureDialogScene(dialogSceneKey, 8, 0, () => {
      const readyScene = this.scene.scene.get(dialogSceneKey);
      if (readyScene && typeof readyScene.showOptionsDialog === 'function') {
        readyScene.showOptionsDialog(payload);
      }
    });

    return false;
  }

  createLikertOptions(questionId, positiveAxis, negativeAxis, labels = null) {
    const texts = labels || {
      stronglyAgree: 'Concordo totalmente',
      agree: 'Concordo',
      neutral: 'Nem concordo nem discordo',
      disagree: 'Discordo',
      stronglyDisagree: 'Discordo totalmente'
    };

    return [
      { id: `${questionId}_strongly_agree`, label: texts.stronglyAgree, axis: positiveAxis, points: 2 },
      { id: `${questionId}_agree`, label: texts.agree, axis: positiveAxis, points: 1 },
      { id: `${questionId}_neutral`, label: texts.neutral, axis: positiveAxis, points: 0 },
      { id: `${questionId}_disagree`, label: texts.disagree, axis: negativeAxis, points: 1 },
      { id: `${questionId}_strongly_disagree`, label: texts.stronglyDisagree, axis: negativeAxis, points: 2 }
    ];
  }

  addAxisPoints(axis, points) {
    if (!axis || !window.gameState?.setStat || !window.gameState?.getStat) {
      return;
    }

    const statKey = `axis_points_${axis}`;
    const current = Number(window.gameState.getStat(statKey) || 0);
    window.gameState.setStat(statKey, current + Number(points || 0));
  }

  appendAxisChoiceEntry({ axis, source, sourceId, label, optionId, influenceType, extra = {} }) {
    if (!axis || typeof window.gameState?.appendAxisChoiceEntry !== 'function') {
      return;
    }

    window.gameState.appendAxisChoiceEntry({
      at: Date.now(),
      axis,
      source,
      sourceId,
      label,
      optionId,
      scene: this.scene.scene?.key || null,
      influenceType,
      ...extra
    });
  }
}