import BaseMapScene from './BaseMapScene.js';
import DoorZone from '../../components/DoorZone.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { SceneDialogueFlowService } from './services/SceneDialogueFlowService.js';
import { ELEVATOR_TEXTS } from '../../i18n/elevatorTexts.js';

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

    const activeObjectives = this.getActiveObjectiveOptions();
    const hasAnyActiveObjective = activeObjectives.length > 0;
    const selectedAxis = window.gameState?.getFlag?.(this.primaryObjectiveAxisFlagKey) || 'nao definido';

    this.dialogueFlow?.ensureDialogScene(SCENE_NAMES.DIALOG, 6, 0, () => {
      this.dialogueFlow?.showOptionsDialog(SCENE_NAMES.DIALOG, {
        name: ELEVATOR_TEXTS.objectiveHub.title,
        greeting: hasAnyActiveObjective
          ? `${ELEVATOR_TEXTS.objectiveHub.menuGreeting} (Eixo foco: ${selectedAxis})`
          : ELEVATOR_TEXTS.objectiveHub.noObjectiveGreeting,
        options: [
          ...activeObjectives,
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

    if (action.type === 'minigame') {
      window.sceneManager?.startMinigame?.(action.target, {
        source: 'quantum_objectives',
        objectiveId: window.gameState?.getFlag?.(this.primaryObjectiveChoiceFlagKey) || 'no-objective-selected'
      });

      if (option?.activeFlag && option?.completeFlag) {
        this.setHubFlag(option.activeFlag, false);
        this.setHubFlag(option.completeFlag, true);
      }

      return;
    }

    if (action.type === 'scene' && option?.activeFlag && option?.completeFlag) {
      this.setHubFlag(option.activeFlag, false);
      this.setHubFlag(option.completeFlag, true);
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
