import BaseMapScene from './BaseMapScene.js';
import DoorZone from '../../components/DoorZone.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { SceneDialogueFlowService } from './services/SceneDialogueFlowService.js';
import { ELEVATOR_TEXTS } from '../../i18n/elevatorTexts.js';
import {
  ENDGAME_LOCK_FLAG,
  countCompletedObjectives,
  isFinalizationUnlocked,
  isReportUnlocked,
  syncObjectiveProgress
} from '../../state/objectiveProgress.js';

export default class QuantumObjectivesScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.QUANTUM_OBJECTIVES, 'elevator');
    this.defaultZoom = 2.0;
    this.bossObjectiveActiveFlagKey = 'objective_talk_to_boss_active';
    this.bossObjectiveCompletedFlagKey = 'objective_talk_to_boss_completed';
    this.teamObjectiveActiveFlagKey = 'objective_talk_to_team_active';
    this.teamObjectiveCompletedFlagKey = 'objective_talk_to_team_completed';
    this.solveObjectiveActiveFlagKey = 'objective_solve_anomaly_active';
    this.solveObjectiveCompletedFlagKey = 'objective_solve_anomaly_completed';
    this.stabilizeObjectiveActiveFlagKey = 'objective_stabilize_system_active';
    this.stabilizeObjectiveCompletedFlagKey = 'objective_stabilize_system_completed';
    this.primaryObjectiveChoiceFlagKey = 'elevator_primary_objective_choice';
    this.primaryObjectiveAxisFlagKey = 'elevator_primary_objective_axis';
    this.hubIntroSeenFlagKey = 'quantum_objective_hub_intro_seen';
    this.endingResolvedFlagKey = 'ending_resolved';
    this.endgameReportOnlyFlagKey = 'janus_endgame_report_only';
    this.endgameCompletedAtFlagKey = 'janus_endgame_completed_at';
  }

  init(data) {
    super.init(data);
    this.isTransitioning = false;
    this.dialogueFlow = new SceneDialogueFlowService(this);

    if (window.gameState?.getFlag?.(this.bossObjectiveActiveFlagKey) === undefined) {
      this.setHubFlag(this.bossObjectiveActiveFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.bossObjectiveCompletedFlagKey) === undefined) {
      this.setHubFlag(this.bossObjectiveCompletedFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.teamObjectiveActiveFlagKey) === undefined) {
      this.setHubFlag(this.teamObjectiveActiveFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.teamObjectiveCompletedFlagKey) === undefined) {
      this.setHubFlag(this.teamObjectiveCompletedFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.solveObjectiveActiveFlagKey) === undefined) {
      this.setHubFlag(this.solveObjectiveActiveFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.solveObjectiveCompletedFlagKey) === undefined) {
      this.setHubFlag(this.solveObjectiveCompletedFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.stabilizeObjectiveActiveFlagKey) === undefined) {
      this.setHubFlag(this.stabilizeObjectiveActiveFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.stabilizeObjectiveCompletedFlagKey) === undefined) {
      this.setHubFlag(this.stabilizeObjectiveCompletedFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.hubIntroSeenFlagKey) === undefined) {
      this.setHubFlag(this.hubIntroSeenFlagKey, false);
    }

    if (window.gameState?.getFlag?.(ENDGAME_LOCK_FLAG) === undefined) {
      this.setHubFlag(ENDGAME_LOCK_FLAG, false);
    }

    if (window.gameState?.getFlag?.(this.endgameReportOnlyFlagKey) === undefined) {
      this.setHubFlag(this.endgameReportOnlyFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.endgameCompletedAtFlagKey) === undefined) {
      this.setHubFlag(this.endgameCompletedAtFlagKey, 0);
    }
  }

  preload() {
    loadPlayerAssets(this);
    preloadRegisteredTilesets(this);
    super.preload();
  }

  create() {
    super.create();

    if (!this.map || !this.layers) {
      return;
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.setupDoorTransitions();
    this.registerDoorZonesToDebugger();
    this.setupCameraForMinimap();

    if (window.gameState?.getFlag?.(this.hubIntroSeenFlagKey) !== true) {
      this.showHubIntro();
      return;
    }

    this.time.delayedCall(220, () => this.openActiveObjectivesMenu());
  }

  setupCameraForMinimap() {
    if (!this.map) {
      return;
    }

    const mapCenterX = (this.map.width * this.map.tileWidth) / 2;
    const mapCenterY = (this.map.height * this.map.tileHeight) / 2;

    this.cameras.main.stopFollow();
    this.cameras.main.setZoom(this.defaultZoom);

    const boundsMargin = Math.max(this.game.canvas.width, this.game.canvas.height);
    this.cameras.main.setBounds(
      -boundsMargin,
      -boundsMargin,
      this.map.widthInPixels + 2 * boundsMargin,
      this.map.heightInPixels + 2 * boundsMargin
    );

    this.cameras.main.centerOn(mapCenterX, mapCenterY);
  }

  showHubIntro() {
    this.dialogueFlow?.ensureDialogScene(SCENE_NAMES.DIALOG, 6, 0, () => {
      this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
        name: ELEVATOR_TEXTS.objectiveHub.title,
        dialogues: ELEVATOR_TEXTS.objectiveHub.hubDialogues.map((text) => ({ text })),
        onComplete: () => {
          this.setHubFlag(this.hubIntroSeenFlagKey, true);
          this.openActiveObjectivesMenu();
        }
      });
    });
  }

  getActiveObjectiveOptions() {
    const options = [];

    if (window.gameState?.getFlag?.(this.bossObjectiveActiveFlagKey) === true) {
      options.push({
        id: 'objective_boss',
        label: ELEVATOR_TEXTS.objectiveHub.menu.boss,
        action: { type: 'scene', target: SCENE_NAMES.BOSS_ROOM },
        completeFlag: this.bossObjectiveCompletedFlagKey,
        activeFlag: this.bossObjectiveActiveFlagKey
      });
    }

    if (window.gameState?.getFlag?.(this.teamObjectiveActiveFlagKey) === true) {
      options.push({
        id: 'objective_team',
        label: ELEVATOR_TEXTS.objectiveHub.menu.team,
        action: { type: 'scene', target: SCENE_NAMES.COFFEE_ROOM },
        completeFlag: this.teamObjectiveCompletedFlagKey,
        activeFlag: this.teamObjectiveActiveFlagKey
      });
    }

    if (window.gameState?.getFlag?.(this.solveObjectiveActiveFlagKey) === true) {
      options.push({
        id: 'objective_solve',
        label: ELEVATOR_TEXTS.objectiveHub.menu.solve,
        action: { type: 'minigame', target: SCENE_NAMES.PUZZLE },
        completeFlag: this.solveObjectiveCompletedFlagKey,
        activeFlag: this.solveObjectiveActiveFlagKey
      });
    }

    if (window.gameState?.getFlag?.(this.stabilizeObjectiveActiveFlagKey) === true) {
      options.push({
        id: 'objective_stabilize',
        label: ELEVATOR_TEXTS.objectiveHub.menu.stabilize,
        action: { type: 'minigame', target: SCENE_NAMES.MEMORY },
        completeFlag: this.stabilizeObjectiveCompletedFlagKey,
        activeFlag: this.stabilizeObjectiveActiveFlagKey
      });
    }

    return options;
  }

  setupDoorTransitions() {
    this.doorZones = [
      new DoorZone(this, {
        x: 8,
        y: 8,
        width: 16,
        height: 16,
        label: ELEVATOR_TEXTS.doors.entryLabel,
        indicatorColor: 0x00ff00,
        indicatorTextColor: '#00ff00',
        onInteract: () => this.transitionToElevator(),
        proximityDistance: 24
      }),
      new DoorZone(this, {
        x: 215,
        y: 43,
        width: 40,
        height: 40,
        label: ELEVATOR_TEXTS.objectiveHub.title,
        indicatorColor: 0x00d9ff,
        indicatorTextColor: '#9de6cb',
        onInteract: () => this.openActiveObjectivesMenu(),
        proximityDistance: 24
      })
    ];
  }

  openActiveObjectivesMenu() {
    if (this.isTransitioning) {
      return;
    }

    syncObjectiveProgress(window.gameState);

    const activeObjectives = this.getActiveObjectiveOptions();
    const hasAnyActiveObjective = activeObjectives.length > 0;
    const selectedAxis = window.gameState?.getFlag?.(this.primaryObjectiveAxisFlagKey) || 'nao definido';
    const completedObjectivesCount = countCompletedObjectives(window.gameState);
    const reportUnlocked = isReportUnlocked(window.gameState, 2);
    const finalizationUnlocked = isFinalizationUnlocked(window.gameState, 4);
    const endingAlreadyResolved = window.gameState?.getFlag?.(this.endingResolvedFlagKey) === true;

    const reportOption = reportUnlocked
      ? [{
          id: 'objective_open_partial_report',
          label: `Abrir Report Base (${completedObjectivesCount}/4 objetivos)`,
          action: { type: 'custom', target: 'open-report' }
        }]
      : [];

    const finalizeOption = (finalizationUnlocked && !endingAlreadyResolved)
      ? [{
          id: 'objective_finalize_story',
          label: 'Finalizar Enredo (Resolver Desfecho)',
          action: { type: 'custom', target: 'resolve-ending' }
        }]
      : [];

    this.dialogueFlow?.ensureDialogScene(SCENE_NAMES.DIALOG, 6, 0, () => {
      this.dialogueFlow?.showOptionsDialog(SCENE_NAMES.DIALOG, {
        name: ELEVATOR_TEXTS.objectiveHub.title,
        greeting: hasAnyActiveObjective
          ? `${ELEVATOR_TEXTS.objectiveHub.menuGreeting} (Eixo foco: ${selectedAxis} | Concluidos: ${completedObjectivesCount}/4)`
          : ELEVATOR_TEXTS.objectiveHub.noObjectiveGreeting,
        options: [
          ...activeObjectives,
          ...reportOption,
          ...finalizeOption,
          {
            id: 'objective_quiz',
            label: ELEVATOR_TEXTS.objectiveHub.menu.quiz,
            action: { type: 'minigame', target: SCENE_NAMES.QUIZ }
          },
          {
            id: 'objective_memory',
            label: ELEVATOR_TEXTS.objectiveHub.menu.memory,
            action: { type: 'minigame', target: SCENE_NAMES.MEMORY }
          },
          {
            id: 'objective_puzzle',
            label: ELEVATOR_TEXTS.objectiveHub.menu.puzzle,
            action: { type: 'minigame', target: SCENE_NAMES.PUZZLE }
          },
          {
            id: 'objective_back',
            label: ELEVATOR_TEXTS.objectiveHub.menu.back,
            action: { type: 'scene', target: SCENE_NAMES.ELEVATOR }
          }
        ],
        onSelect: (option) => this.handleObjectiveOption(option)
      });
    });
  }

  handleObjectiveOption(option) {
    const action = option?.action;
    if (!action) {
      return;
    }

    if (option?.id === 'objective_finalize_story') {
      this.resolveAndShowEnding();
      return;
    }

    if (option?.id === 'objective_open_partial_report') {
      this.openProgressReport();
      return;
    }

    if (action.type === 'minigame') {
      window.sceneManager?.startMinigame?.(action.target, {
        source: 'quantum_objectives',
        objectiveId: window.gameState?.getFlag?.(this.primaryObjectiveChoiceFlagKey) || 'no-objective-selected',
        objectiveContext: {
          source: 'objective-hub',
          objectiveId: option?.id || null
        }
      });

      return;
    }

    if (action.type === 'scene' && action.target) {
      this.isTransitioning = true;
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        window.sceneManager.goToMap(action.target, {
          user: this.user,
          spawnPoint: 'fromQuantumObjectives'
        });
      });
    }
  }

  resolveAndShowEnding() {
    syncObjectiveProgress(window.gameState);

    if (!isFinalizationUnlocked(window.gameState, 4)) {
      this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
        name: 'Janus IA',
        dialogues: [
          { text: 'Ainda nao e possivel fechar o enredo.' },
          { text: 'Conclua os 4 objetivos antes de resolver o desfecho.' }
        ],
        onComplete: () => this.openActiveObjectivesMenu()
      });
      return;
    }

    const resolver = window.resolveEndingFromState;
    const applyEnding = window.applyEndingToGameState;
    const state = window.gameState?.getState?.();

    if (typeof resolver !== 'function' || !state) {
      return;
    }

    const ending = resolver(state);
    if (!ending) {
      this.openActiveObjectivesMenu();
      return;
    }

    if (typeof applyEnding === 'function') {
      applyEnding(window.gameState, ending);
    }

    this.setHubFlag(ENDGAME_LOCK_FLAG, true);
    this.setHubFlag(this.endgameReportOnlyFlagKey, true);
    this.setHubFlag(this.endgameCompletedAtFlagKey, Date.now());

    this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
      name: 'Janus IA - Desfecho',
      dialogues: [
        { text: ending.title },
        { text: ending.summary },
        ...ending.dialogues.map((text) => ({ text }))
      ],
      onComplete: () => {
        this.openProgressReport();
        this.transitionToElevator();
      }
    });
  }

  async openProgressReport() {
    try {
      const module = await import('../../report/openBaseReport.js');
      const openBaseReportFromGame = module?.openBaseReportFromGame;
      if (typeof openBaseReportFromGame !== 'function') {
        throw new Error('openBaseReportFromGame not available');
      }

      openBaseReportFromGame({
        mode: 'prod'
      });
    } catch (error) {
      console.error('[QuantumObjectivesScene] Falha ao abrir report:', error);
    }
  }

  transitionToElevator() {
    if (this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.ELEVATOR, {
        user: this.user,
        spawnPoint: 'fromQuantumObjectives'
      });
    });
  }

  update() {
    super.update();

    if (this.player && this.doorZones) {
      this.doorZones.forEach((door) => door.update(this.player, this.input, this.tweens));
    }
  }

  getSpawnX() {
    return 8;
  }

  getSpawnY() {
    return 8;
  }

  setupNPCs() {
    this.npcs = [];
  }

  setHubFlag(flagKey, value) {
    if (flagKey && window.gameState?.setFlag) {
      window.gameState.setFlag(flagKey, value);
    }
  }
}
