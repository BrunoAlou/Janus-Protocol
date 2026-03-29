import BaseMapScene from './BaseMapScene.js';
import DoorZone from '../../components/DoorZone.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { SceneDialogueFlowService } from './services/SceneDialogueFlowService.js';
import { ElevatorIntroducer } from './services/elevator/ElevatorIntroducer.js';
import { ELEVATOR_TEXTS } from '../../i18n/elevatorTexts.js';

/**
 * ElevatorScene - Cena do elevador (minimapa)
 */
export default class ElevatorScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.ELEVATOR, 'elevator');
    this.defaultZoom = 2.0; // Zoom menor = mapa menor aparece maior na tela (centralizado)
    this.janusCompletedFlagKey = 'elevator_janus_assessment_completed';
    this.janusRunningFlagKey = 'elevator_janus_assessment_running';
    this.elevatorModalFlowFlagKey = 'elevator_intro_modal_active';
    this.elevatorDialogFlowFlagKey = 'elevator_intro_dialog_active';
    this.elevatorModalSeenFlagKey = 'elevator_intro_modal_seen';
    this.elevatorDialogSeenFlagKey = 'elevator_intro_dialog_seen';
    this.elevatorQuantumIntroCompletedFlagKey = 'elevator_quantum_intro_completed';
    this.elevatorObjectiveChoiceFlagKey = 'elevator_primary_objective_choice';
    this.elevatorObjectiveAxisFlagKey = 'elevator_primary_objective_axis';
    this.elevatorBossObjectiveActiveFlagKey = 'objective_talk_to_boss_active';
    this.elevatorBossObjectiveCompletedFlagKey = 'objective_talk_to_boss_completed';
    this.elevatorTeamObjectiveActiveFlagKey = 'objective_talk_to_team_active';
    this.elevatorTeamObjectiveCompletedFlagKey = 'objective_talk_to_team_completed';
    this.elevatorSolveObjectiveActiveFlagKey = 'objective_solve_anomaly_active';
    this.elevatorSolveObjectiveCompletedFlagKey = 'objective_solve_anomaly_completed';
    this.elevatorStabilizeObjectiveActiveFlagKey = 'objective_stabilize_system_active';
    this.elevatorStabilizeObjectiveCompletedFlagKey = 'objective_stabilize_system_completed';
    this.dialogSceneKey = SCENE_NAMES.DIALOG;
    this._janusAssessmentRunning = false;
  }

  init(data) {
    super.init(data);
    // Forçar spawn no ponto padrão do elevador, ignorar posição anterior
    this.resumePosition = null;
    this.isTransitioning = false;
    this._janusAssessmentRunning = false;
    this.dialogueFlow = new SceneDialogueFlowService(this);
    this.introducer = new ElevatorIntroducer(this);
    this.onboardingModalOpen = false;
    this.onboardingDialogOpen = false;

    this.setElevatorFlag(this.elevatorModalFlowFlagKey, false);
    this.setElevatorFlag(this.elevatorDialogFlowFlagKey, false);

    if (window.gameState?.getFlag?.(this.elevatorModalSeenFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorModalSeenFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorDialogSeenFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorDialogSeenFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorQuantumIntroCompletedFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorQuantumIntroCompletedFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorObjectiveChoiceFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorObjectiveChoiceFlagKey, null);
    }
    if (window.gameState?.getFlag?.(this.elevatorObjectiveAxisFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorObjectiveAxisFlagKey, null);
    }
    if (window.gameState?.getFlag?.(this.elevatorBossObjectiveActiveFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorBossObjectiveActiveFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorBossObjectiveCompletedFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorBossObjectiveCompletedFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorTeamObjectiveActiveFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorTeamObjectiveActiveFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorTeamObjectiveCompletedFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorTeamObjectiveCompletedFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorSolveObjectiveActiveFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorSolveObjectiveActiveFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorSolveObjectiveCompletedFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorSolveObjectiveCompletedFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorStabilizeObjectiveActiveFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorStabilizeObjectiveActiveFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.elevatorStabilizeObjectiveCompletedFlagKey) === undefined) {
      this.setElevatorFlag(this.elevatorStabilizeObjectiveCompletedFlagKey, false);
    }
  }

  preload() {
    loadPlayerAssets(this);
    preloadRegisteredTilesets(this);
    // Carregar tilemap do elevador via resolver
    super.preload();
  }

  create() {
    super.create();

    if (!this.map || !this.layers) {
      console.error('[ElevatorScene] create aborted: map/layers indisponíveis');
      return;
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.setupDoorTransitions();
    this.registerDoorZonesToDebugger();
    // Centralizar câmera no mapa (override do setupCamera da base)
    this.setupCameraForMinimap();
    // Adicionar animações de partículas ao redor do elevador
    this.setupElevatorParticles();
    this.showQuantumIntroFlow();
    // Outras inicializações específicas do elevador
  }

  showQuantumIntroFlow() {
    this.introducer?.showIntroductionFlow(() => {
      this.scheduleAutoJanusAssessment();
    });
  }

  scheduleAutoJanusAssessment(attempt = 0) {
    if (this.isJanusAssessmentCompleted() || this._janusAssessmentRunning) {
      return;
    }

    const dialogReady = this.dialogueFlow?.ensureDialogScene(
      SCENE_NAMES.DIALOG,
      10,
      attempt,
      () => {
        this.time.delayedCall(220, () => {
          if (!this._janusAssessmentRunning && !this.isJanusAssessmentCompleted()) {
            this.startJanusAssessment();
          }
        });
      }
    );

    if (!dialogReady && attempt >= 10) {
      console.warn('[ElevatorScene] DialogScene not ready for automatic Janus dialog');
    }
  }

  /**
   * Centraliza a câmera no mapa do elevador de forma correta
   */
  setupCameraForMinimap() {
    console.log('[ElevatorScene] setupCameraForMinimap() chamado');

    if (!this.map) {
      console.error('[ElevatorScene] setupCameraForMinimap abortado: this.map indefinido');
      return;
    }
    
    // Dados do mapa
    console.log('[ElevatorScene] Mapa info:', {
      width: this.map.width,
      height: this.map.height,
      tileWidth: this.map.tileWidth,
      tileHeight: this.map.tileHeight,
      widthInPixels: this.map.widthInPixels,
      heightInPixels: this.map.heightInPixels
    });
    
    // Centro do mapa em pixels do mundo
    const mapCenterX = (this.map.width * this.map.tileWidth) / 2;
    const mapCenterY = (this.map.height * this.map.tileHeight) / 2;
    console.log('[ElevatorScene] Centro do mapa:', { mapCenterX, mapCenterY });
    
    // Parar de seguir o player
    this.cameras.main.stopFollow();
    console.log('[ElevatorScene] Camera stopFollow()');
    
    // Aplicar o zoom
    this.cameras.main.setZoom(this.defaultZoom);
    console.log('[ElevatorScene] Zoom aplicado:', this.defaultZoom);
    
    // Definir bounds MAIORES que o mapa para permitir espaço vazio ao redor
    // Isso permite que a câmera centralize o mapa pequeno
    const boundsMargin = Math.max(this.game.canvas.width, this.game.canvas.height);
    this.cameras.main.setBounds(
      -boundsMargin,
      -boundsMargin,
      this.map.widthInPixels + 2 * boundsMargin,
      this.map.heightInPixels + 2 * boundsMargin
    );
    console.log('[ElevatorScene] Camera bounds definidos com margem');
    
    // Centralizar a câmera no centro do mapa
    this.cameras.main.centerOn(mapCenterX, mapCenterY);
    console.log('[ElevatorScene] Camera centralized em:', { mapCenterX, mapCenterY });
    
    // Verificar posição final da câmera
    console.log('[ElevatorScene] Posição final da câmera:', {
      x: this.cameras.main.x,
      y: this.cameras.main.y,
      scrollX: this.cameras.main.scrollX,
      scrollY: this.cameras.main.scrollY,
      zoom: this.cameras.main.zoom
    });
    
    console.log('[ElevatorScene] Viewport visível:', {
      left: this.cameras.main.worldView.left,
      top: this.cameras.main.worldView.top,
      right: this.cameras.main.worldView.right,
      bottom: this.cameras.main.worldView.bottom,
      width: this.cameras.main.worldView.width,
      height: this.cameras.main.worldView.height
    });
  } 

  setupDoorTransitions() {
    // Zona de acesso rapido para a entrada do elevador e painel de destinos
    this.doorZones = [
      new DoorZone(this, {
        x: 8, y: 8, width: 16, height: 16, // Posição central do minimapa 16x16
        label: ELEVATOR_TEXTS.doors.entryLabel,
        indicatorColor: 0x00ff00,
        indicatorTextColor: '#00ff00',
        onInteract: () => this.transitionToItRoom(),
        proximityDistance: 24
      }),
      new DoorZone(this, {
        x: 215,
        y: 43,
        width: 40,
        height: 40,
        label: ELEVATOR_TEXTS.doors.destinationsLabel,
        indicatorColor: 0xffcc00,
        indicatorTextColor: '#ffcc00',
        onInteract: () => this.openElevatorDestinations(),
        proximityDistance: 24
      })
    ];
  }

  openElevatorDestinations() {
    if (this.isTransitioning) return;

    if (this._janusAssessmentRunning) {
      return;
    }

    const dialogScene = this.scene.get(SCENE_NAMES.DIALOG);
    if (!dialogScene) {
      console.warn('[ElevatorScene] DialogScene indisponivel para destinos');
      return;
    }

    if (!this.scene.isActive(SCENE_NAMES.DIALOG)) {
      this.scene.launch(SCENE_NAMES.DIALOG);
    }

    if (window.gameState?.getFlag?.(this.elevatorQuantumIntroCompletedFlagKey) !== true) {
      this.showQuantumIntroFlow();
      return;
    }

    if (!this.isJanusAssessmentCompleted()) {
      this.startJanusAssessment();
      return;
    }

    if (!this.hasPrimaryObjectiveSelected()) {
      this.showObjectiveDefinitionMenu();
      return;
    }

    this.showDestinationMenu();
  }

  hasPrimaryObjectiveSelected() {
    return !!window.gameState?.getFlag?.(this.elevatorObjectiveChoiceFlagKey);
  }

  isJanusAssessmentCompleted() {
    return window.gameState?.getFlag?.(this.janusCompletedFlagKey) === true;
  }

  setJanusFlag(flagKey, value) {
    if (window.gameState?.setFlag) {
      window.gameState.setFlag(flagKey, value);
    }
  }

  createLikertOptions(questionId, positiveAxis, negativeAxis) {
    const labels = ELEVATOR_TEXTS.janus.likertLabels;
    return this.dialogueFlow?.createLikertOptions(questionId, positiveAxis, negativeAxis, labels) || [];
  }

  getJanusQuestions() {
    return (ELEVATOR_TEXTS.janus.questions || []).map((question) => {
      if (!question.likert) {
        return question;
      }

      return {
        id: question.id,
        prompt: question.prompt,
        options: this.createLikertOptions(
          question.likert.id,
          question.likert.positiveAxis,
          question.likert.negativeAxis
        )
      };
    });
  }

  startJanusAssessment() {
    const dialogScene = this.scene.get(SCENE_NAMES.DIALOG);
    if (!dialogScene) {
      return;
    }

    this._janusAssessmentRunning = true;
    this.setJanusFlag(this.janusRunningFlagKey, true);

    this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
      name: 'Janus IA',
      dialogues: ELEVATOR_TEXTS.janus.introDialogues.map((text, index) => ({
        text,
        emotion: index === 0 ? 'neutral' : 'professional'
      })),
      onComplete: () => {
        this.showJanusQuestion(0);
      }
    });
  }

  showJanusQuestion(questionIndex) {
    const questions = this.getJanusQuestions();
    if (questionIndex >= questions.length) {
      this.finishJanusAssessment();
      return;
    }

    const question = questions[questionIndex];
    const dialogScene = this.scene.get(SCENE_NAMES.DIALOG);
    if (!dialogScene) {
      this._janusAssessmentRunning = false;
      this.setJanusFlag(this.janusRunningFlagKey, false);
      return;
    }

    this.dialogueFlow?.showOptionsDialog(SCENE_NAMES.DIALOG, {
      name: 'Janus IA',
      greeting: `${ELEVATOR_TEXTS.janus.questionPrefix} ${questionIndex + 1}/${questions.length}: ${question.prompt}`,
      options: question.options.map((choice) => ({
        id: choice.id,
        label: choice.label,
        action: {
          type: 'event',
          target: 'janus-answer',
          data: {
            axis: choice.axis,
            points: choice.points
          }
        }
      })),
      onSelect: (option) => {
        this.handleJanusAnswer(question, option, questionIndex);
      },
      onClose: () => {
        // Mantem o fluxo obrigatorio: se fechar sem responder, reabre a mesma pergunta.
        if (this._janusAssessmentRunning) {
          this.time.delayedCall(80, () => this.showJanusQuestion(questionIndex));
        }
      }
    });
  }

  handleJanusAnswer(question, option, questionIndex) {
    const selectedOption = question.options.find((choice) => choice.id === option?.id);
    if (!selectedOption) {
      this.showJanusQuestion(questionIndex);
      return;
    }

    this.setJanusFlag(`elevator_${question.id}_answer`, selectedOption.id);

    const axis = selectedOption.axis;
    const points = Number(selectedOption.points || 0);

    this.dialogueFlow?.addAxisPoints(axis, points);
    this.dialogueFlow?.appendAxisChoiceEntry({
      axis,
      source: 'Janus IA',
      sourceId: 'elevator_janus_assessment',
      label: selectedOption.label,
      optionId: selectedOption.id,
      influenceType: 'janus_assessment'
    });

    this.showJanusQuestion(questionIndex + 1);
  }

  finishJanusAssessment() {
    const dialogScene = this.scene.get(SCENE_NAMES.DIALOG);

    this._janusAssessmentRunning = false;
    this.setJanusFlag(this.janusCompletedFlagKey, true);
    this.setJanusFlag(this.janusRunningFlagKey, false);

    if (!dialogScene) {
      return;
    }

    this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
      name: 'Janus IA',
      dialogues: ELEVATOR_TEXTS.janus.completionDialogues.map((text, index) => ({
        text,
        emotion: index === 0 ? 'professional' : 'neutral'
      })),
      onComplete: () => {
        this.showObjectiveDefinitionMenu();
      }
    });
  }

  showObjectiveDefinitionMenu() {
    const objectiveOptions = Object.values(ELEVATOR_TEXTS.objectiveSelection.options || {});

    this.dialogueFlow?.showOptionsDialog(SCENE_NAMES.DIALOG, {
      name: ELEVATOR_TEXTS.objectiveSelection.name,
      greeting: ELEVATOR_TEXTS.objectiveSelection.greeting,
      options: objectiveOptions.map((item) => ({
        id: item.id,
        label: item.label,
        action: {
          type: 'event',
          target: 'objective-select',
          data: {
            objectiveKey: item.objectiveKey,
            axis: item.axis,
            points: item.points
          }
        }
      })),
      onSelect: (option) => {
        const choice = objectiveOptions.find((item) => item.id === option?.id);
        if (!choice) {
          return;
        }
        this.applyPrimaryObjectiveChoice(choice);
      },
      onClose: () => {
        if (!this.hasPrimaryObjectiveSelected()) {
          this.time.delayedCall(80, () => this.showObjectiveDefinitionMenu());
        }
      }
    });
  }

  applyPrimaryObjectiveChoice(choice) {
    const objectiveKey = choice.objectiveKey;
    const axis = choice.axis;
    const points = Number(choice.points || 0);

    this.setElevatorFlag(this.elevatorObjectiveChoiceFlagKey, objectiveKey);
    this.setElevatorFlag(this.elevatorObjectiveAxisFlagKey, axis);

    this.setElevatorFlag(this.elevatorBossObjectiveActiveFlagKey, objectiveKey === 'boss');
    this.setElevatorFlag(this.elevatorBossObjectiveCompletedFlagKey, false);

    this.setElevatorFlag(this.elevatorTeamObjectiveActiveFlagKey, objectiveKey === 'team');
    this.setElevatorFlag(this.elevatorTeamObjectiveCompletedFlagKey, false);

    this.setElevatorFlag(this.elevatorSolveObjectiveActiveFlagKey, objectiveKey === 'solve');
    this.setElevatorFlag(this.elevatorSolveObjectiveCompletedFlagKey, false);

    this.setElevatorFlag(this.elevatorStabilizeObjectiveActiveFlagKey, objectiveKey === 'stabilize');
    this.setElevatorFlag(this.elevatorStabilizeObjectiveCompletedFlagKey, false);

    this.dialogueFlow?.addAxisPoints(axis, points);
    this.dialogueFlow?.appendAxisChoiceEntry({
      axis,
      source: 'Janus IA',
      sourceId: 'elevator_primary_objective',
      label: choice.label,
      optionId: choice.id,
      influenceType: 'objective_definition',
      extra: {
        objectiveKey
      }
    });

    this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
      name: ELEVATOR_TEXTS.objectiveSelection.name,
      dialogues: [
        {
          text: `${ELEVATOR_TEXTS.objectiveSelection.confirmationPrefix} ${choice.label}`,
          emotion: 'professional'
        },
        {
          text: `Eixo priorizado: ${axis}. Destinos do elevador atualizados.`,
          emotion: 'neutral'
        }
      ],
      onComplete: () => {
        this.showDestinationMenu();
      }
    });
  }

  showDestinationMenu() {

    this.dialogueFlow?.showOptionsDialog(SCENE_NAMES.DIALOG, {
      name: ELEVATOR_TEXTS.destinationMenu.name,
      greeting: ELEVATOR_TEXTS.destinationMenu.greeting,
      options: [
        {
          id: 'garden',
          label: ELEVATOR_TEXTS.destinationMenu.options.garden,
          icon: '🌳',
          action: { type: 'scene', target: SCENE_NAMES.GARDEN }
        },
        {
          id: 'coffee-room',
          label: ELEVATOR_TEXTS.destinationMenu.options.coffeeRoom,
          icon: '☕',
          action: { type: 'scene', target: SCENE_NAMES.COFFEE_ROOM }
        },
        {
          id: 'boss-room',
          label: ELEVATOR_TEXTS.destinationMenu.options.bossRoom,
          icon: '👔',
          action: { type: 'scene', target: SCENE_NAMES.BOSS_ROOM }
        },
        {
          id: 'active-objectives',
          label: ELEVATOR_TEXTS.destinationMenu.options.activeObjectives,
          icon: '🎯',
          action: { type: 'scene', target: SCENE_NAMES.QUANTUM_OBJECTIVES }
        },
        {
          id: 'hallway',
          label: ELEVATOR_TEXTS.destinationMenu.options.itRoom,
          icon: '🚪',
          action: { type: 'scene', target: SCENE_NAMES.IT_ROOM }
        },
        {
          id: 'cancel',
          label: ELEVATOR_TEXTS.destinationMenu.options.cancel,
          icon: '↩️',
          action: { type: 'cancel' }
        }
      ],
      onSelect: (option) => this.handleElevatorDestination(option)
    });
  }

  handleElevatorDestination(option) {
    if (!option?.action || option.action.type !== 'scene') return;

    const targetScene = option.action.target;
    if (!targetScene || this.isTransitioning) return;

    this.isTransitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(targetScene, {
        user: this.user,
        spawnPoint: 'fromElevator'
      });
    });
  }

  /**
   * Cria animações de linhas que sobem verticalmente
   */
  setupElevatorParticles() {
    console.log('[ElevatorScene] Configurando sistema de linhas ascendentes');

    // Pegar dimensões do minimapa (16x16 tiles * 16 pixels)
    const mapCenterX = (this.map.width * this.map.tileWidth) / 2;
    const mapCenterY = (this.map.height * this.map.tileHeight) / 2;
    const mapHalfWidth = (this.map.width * this.map.tileWidth) / 2;
    const mapHalfHeight = (this.map.height * this.map.tileHeight) / 2;

    // Configurar sistema de linhas que sobem
    this.risingLines = {
      container: this.add.container(),
      safeZoneX: { min: mapCenterX - mapHalfWidth, max: mapCenterX + mapHalfWidth },
      safeZoneY: { min: mapCenterY - mapHalfHeight, max: mapCenterY + mapHalfHeight },
      spawnCounter: 0
    };
    this.risingLines.container.setDepth(-2);

    console.log('[ElevatorScene] Sistema de linhas ascendentes criado');
  }

  createRisingLine() {
    if (!this.risingLines) return;

    const viewport = this.cameras.main.worldView;
    const safeZone = this.risingLines.safeZoneX;

    // Gerar posição X aleatória fora da zona segura
    let x;
    if (Math.random() > 0.5) {
      // Esquerda
      x = viewport.left + Math.random() * (safeZone.min - viewport.left);
    } else {
      // Direita
      x = safeZone.max + Math.random() * (viewport.right - safeZone.max);
    }

    const startY = viewport.bottom;
    const lineHeight = 50 + Math.random() * 150; // 50-200 pixels
    const duration = 2000 + Math.random() * 3000; // 2-5 segundos
    const grayTone = 0x333333 + Math.floor(Math.random() * 0x444444); // Tons cinza-escuro
    const alpha = 0.3 + Math.random() * 0.4; // 0.3-0.7 de opacidade

    // Criar graphics para a linha
    const graphics = this.make.graphics({ add: false });
    graphics.lineStyle(1, grayTone, alpha);
    graphics.lineBetween(0, 0, 0, lineHeight);
    graphics.setPosition(x, startY);
    graphics.setDepth(-2);

    this.risingLines.container.add(graphics);

    // Tweens para movimento e fade
    this.tweens.add({
      targets: graphics,
      y: viewport.top - lineHeight,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        graphics.destroy();
      }
    });

    // Fade out no final
    this.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: duration,
      ease: 'Linear'
    });
  }

  update() {
    super.update();
    
    // Criar novas linhas ascendentes a cada frame com probabilidade
    if (this.risingLines) {
      this.risingLines.spawnCounter++;
      // Criar uma linha a cada 10 frames aproximadamente (60fps = ~6 linhas/segundo)
      if (this.risingLines.spawnCounter >= 10) {
        this.createRisingLine();
        this.risingLines.spawnCounter = 0;
      }
    }
    
    if (this.player && this.doorZones) {
      this.doorZones.forEach(door => door.update(this.player, this.input, this.tweens));
    }
  }

  transitionToItRoom() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.IT_ROOM, {
        user: this.user,
        spawnPoint: 'fromElevator'
      });
    });
  }

  getSpawnX() {
    return 36;
  }

  getSpawnY() {
    return 56;
  }

  setupNPCs() {
    this.npcs = [];
  }

  setElevatorFlag(flagKey, value) {
    if (flagKey && window.gameState?.setFlag) {
      window.gameState.setFlag(flagKey, value);
    }
  }
}
