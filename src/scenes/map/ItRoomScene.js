import BaseMapScene from './BaseMapScene.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import DoorZone from '../../components/DoorZone.js';
import { getTextureKeyForTileset, preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import { resolveMapPath } from '../../utils/AssetResolver.js';
import NPCFactory from '../../npcs/NPCFactory.js';
import { IT_ROOM_NPCS_CONFIG } from '../../data/npcs/itRoomNpcs.js';
import { NPC_TEXTS } from '../../i18n/npcTexts.js';
import { normalizeNpcConfig, toNpcList } from '../../npcs/npcConfig.js';
import { SceneDialogueFlowService } from './services/SceneDialogueFlowService.js';
import {
  createItSitNpcAnimations,
  getItSitAnimationKey,
  loadItSitNpcAssets
} from '../../npcs/itSitAnimations.js';

/**
 * ItRoomScene - Sala de TI / Informática
 */
export default class ItRoomScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.IT_ROOM, 'it-room');
  }

  preload() {
    console.log('[ItRoomScene] Preload started');
    
    // Carregar assets do player
    loadPlayerAssets(this);
    
    // Carregar tilesets de forma padronizada pelo registro central
    preloadRegisteredTilesets(this);
    
    // Carregar mapa da sala de TI
    this.load.tilemapTiledJSON(this.mapKey, resolveMapPath(this.mapKey));

    const dialogueByNpcId = NPC_TEXTS.itRoom?.dialogues || {};
    const configs = toNpcList(IT_ROOM_NPCS_CONFIG)
      .map((cfg) => normalizeNpcConfig({
        ...cfg,
        dialogues: Array.isArray(dialogueByNpcId[cfg.id]) ? dialogueByNpcId[cfg.id] : []
      }));
    loadItSitNpcAssets(this, configs);
    
    console.log('[ItRoomScene] Preload finished');
  }

  init(data) {
    super.init(data);
    this.spawnPoint = data.spawnPoint || 'default';
    this.isTransitioning = false;
    this.dialogueFlow = new SceneDialogueFlowService(this);
    this.tiManagerNpcId = 'npc_it_bruno';
    this.tiCollaboratorNpcIds = ['npc_it_alan', 'npc_it_marcos', 'npc_it_carlos', 'npc_it_diego'];
    this.tiAxisRoundFlagKey = 'ti_axis_round';
    this.tiJourneyCompletedFlagKey = 'ti_axis_journey_completed';
    this.tiManagerIntroBonusFlagKey = 'ti_axis_manager_intro_bonus';

    this._initializeTiJourneyFlags();
  }

  create() {
    super.create();
    window.gameState?.setFlag?.('checkpoint_it_room_visited', true);
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Configurar zonas de transição
    this.setupDoorTransitions();
    
    // Registrar zonas de portas no debugger de colisão
    this.registerDoorZonesToDebugger();
    
    console.log('[ItRoomScene] IT Room loaded, spawn:', this.spawnPoint);
  }

  async setupElements() {
    await super.setupElements();
    this.configureTiNpcJourney();
  }

  _initializeTiJourneyFlags() {
    if (!window.gameState?.getFlag || !window.gameState?.setFlag) {
      return;
    }

    if (window.gameState.getFlag(this.tiAxisRoundFlagKey) === undefined) {
      window.gameState.setFlag(this.tiAxisRoundFlagKey, 1);
    }

    if (window.gameState.getFlag(this.tiJourneyCompletedFlagKey) === undefined) {
      window.gameState.setFlag(this.tiJourneyCompletedFlagKey, false);
    }

    if (window.gameState.getFlag(this.tiManagerIntroBonusFlagKey) === undefined) {
      window.gameState.setFlag(this.tiManagerIntroBonusFlagKey, false);
    }
  }

  _getTiRound() {
    const round = Number(window.gameState?.getFlag?.(this.tiAxisRoundFlagKey) || 1);
    return round >= 2 ? 2 : 1;
  }

  _setTiRound(round) {
    window.gameState?.setFlag?.(this.tiAxisRoundFlagKey, round >= 2 ? 2 : 1);
  }

  _isTiJourneyCompleted() {
    return window.gameState?.getFlag?.(this.tiJourneyCompletedFlagKey) === true;
  }

  _setTiJourneyCompleted(value) {
    window.gameState?.setFlag?.(this.tiJourneyCompletedFlagKey, value === true);
  }

  _getManagerAnsweredFlagKey(round) {
    return `ti_axis_manager_answered_round_${round}`;
  }

  _getCollaboratorAnsweredFlagKey(npcId, round) {
    return `ti_axis_collab_answered_${npcId}_round_${round}`;
  }

  _isManagerAnswered(round) {
    return window.gameState?.getFlag?.(this._getManagerAnsweredFlagKey(round)) === true;
  }

  _setManagerAnswered(round, value) {
    window.gameState?.setFlag?.(this._getManagerAnsweredFlagKey(round), value === true);
  }

  _isCollaboratorAnswered(npcId, round) {
    return window.gameState?.getFlag?.(this._getCollaboratorAnsweredFlagKey(npcId, round)) === true;
  }

  _setCollaboratorAnswered(npcId, round, value) {
    window.gameState?.setFlag?.(this._getCollaboratorAnsweredFlagKey(npcId, round), value === true);
  }

  _areAllCollaboratorsAnswered(round) {
    return this.tiCollaboratorNpcIds.every((npcId) => this._isCollaboratorAnswered(npcId, round));
  }

  _addAxisPoints(axis, points) {
    this.dialogueFlow?.addAxisPoints(axis, points);
  }

  _showTiDialog(name, dialogues, onComplete = null) {
    this.dialogueFlow?.showDialog(SCENE_NAMES.DIALOG, {
      name,
      dialogues: dialogues.map((text) => ({ text })),
      onComplete
    });
  }

  _showTiOptions({ name, greeting, options, onSelect, onClose }) {
    this.dialogueFlow?.showOptionsDialog(SCENE_NAMES.DIALOG, {
      name,
      greeting,
      options,
      onSelect,
      onClose
    });
  }

  _createLikertOptions(questionId, positiveAxis, negativeAxis) {
    const labels = NPC_TEXTS.itRoom?.journey?.likert;
    return this.dialogueFlow?.createLikertOptions(questionId, positiveAxis, negativeAxis, labels) || [];
  }

  _getBrunoQuestion(round) {
    const question = NPC_TEXTS.itRoom?.journey?.manager?.questions?.[round];
    return question || { prompt: '', options: [] };
  }

  _getCollaboratorQuestion(npcId, round) {
    const prompts = NPC_TEXTS.itRoom?.journey?.collaborators?.promptsByNpcId || {};
    const axisPair = NPC_TEXTS.itRoom?.journey?.collaborators?.axisPairByNpcId || {};
    const [positiveAxis, negativeAxis] = axisPair[npcId] || ['execution', 'innovation'];
    const prompt = prompts[npcId]?.[round] || '';

    return {
      prompt,
      options: this._createLikertOptions(`${npcId}_r${round}`, positiveAxis, negativeAxis)
    };
  }

  configureTiNpcJourney() {
    const manager = this.elementManager?.getElement?.(this.tiManagerNpcId);
    if (manager) {
      this._wrapTiNpcInteraction(manager, (trigger) => this._handleBrunoInteraction(trigger));
    }

    this.tiCollaboratorNpcIds.forEach((npcId) => {
      const collaborator = this.elementManager?.getElement?.(npcId);
      if (!collaborator) {
        return;
      }
      this._wrapTiNpcInteraction(collaborator, (trigger) => this._handleCollaboratorInteraction(npcId, collaborator, trigger));
    });
  }

  _wrapTiNpcInteraction(element, handler) {
    if (!element || element._tiJourneyWrapped) {
      return;
    }

    element.interact = (trigger = 'manual') => handler(trigger);
    element._tiJourneyWrapped = true;
  }

  _handleBrunoInteraction() {
    const managerTexts = NPC_TEXTS.itRoom?.journey?.manager || {};
    const managerName = NPC_TEXTS.itRoom?.journey?.managerName || '';

    if (this._isTiJourneyCompleted()) {
      this._showTiDialog(managerName, managerTexts.completedDialogues || []);
      return;
    }

    let round = this._getTiRound();
    const managerAnswered = this._isManagerAnswered(round);
    const allCollaboratorsDone = this._areAllCollaboratorsAnswered(round);

    if (managerAnswered && !allCollaboratorsDone) {
      this._showTiDialog(managerName, managerTexts.blockedUntilTeamDialogues || []);
      return;
    }

    if (managerAnswered && allCollaboratorsDone && round === 1) {
      round = 2;
      this._setTiRound(2);
    }

    if (managerAnswered && allCollaboratorsDone && round === 2) {
      this._setTiJourneyCompleted(true);
      this._showTiDialog(managerName, managerTexts.finalDialogues || []);
      return;
    }

    const showQuestion = () => {
      const question = this._getBrunoQuestion(round);
      this._showTiOptions({
        name: managerName,
        greeting: question.prompt,
        options: question.options.map((opt) => ({
          id: opt.id,
          label: opt.label,
          axis: opt.axis,
          points: opt.points,
          action: { type: 'event', target: 'ti-bruno-answer' }
        })),
        onSelect: (selected) => {
          const answer = question.options.find((opt) => opt.id === selected?.id);
          if (!answer) {
            return;
          }

          this._addAxisPoints(answer.axis, answer.points);
          this._setManagerAnswered(round, true);
          window.gameState?.setFlag?.(`ti_bruno_round_${round}_answer`, answer.id);

          const followUpText = managerTexts.roundFollowUp?.[round] || '';
          this._showTiDialog(managerName, followUpText ? [followUpText] : []);
        }
      });
    };

    if (round === 1 && window.gameState?.getFlag?.(this.tiManagerIntroBonusFlagKey) !== true) {
      this._addAxisPoints('execution', 1);
      window.gameState?.setFlag?.(this.tiManagerIntroBonusFlagKey, true);
      this._showTiDialog(managerName, managerTexts.introDialogues || [], showQuestion);
      return;
    }

    showQuestion();
  }

  _handleCollaboratorInteraction(npcId, collaborator) {
    const collaboratorTexts = NPC_TEXTS.itRoom?.journey?.collaborators || {};
    const fallbackName = NPC_TEXTS.itRoom?.journey?.collaboratorFallbackName || '';
    const collaboratorName = collaborator?.name || fallbackName;

    if (this._isTiJourneyCompleted()) {
      this._showTiDialog(collaboratorName, collaboratorTexts.completedDialogues || []);
      return;
    }

    const round = this._getTiRound();
    const managerAnswered = this._isManagerAnswered(round);
    const alreadyAnswered = this._isCollaboratorAnswered(npcId, round);
    const allDone = this._areAllCollaboratorsAnswered(round);

    if (!managerAnswered) {
      this._showTiDialog(collaboratorName, collaboratorTexts.blockedByManagerDialogues || []);
      return;
    }

    if (alreadyAnswered && !allDone) {
      this._showTiDialog(collaboratorName, collaboratorTexts.alreadyAnsweredDialogues || []);
      return;
    }

    if (alreadyAnswered && allDone) {
      this._showTiDialog(collaboratorName, collaboratorTexts.allDoneRoundDialogues || []);
      return;
    }

    const question = this._getCollaboratorQuestion(npcId, round);
    this._showTiOptions({
      name: collaboratorName,
      greeting: question.prompt,
      options: question.options.map((opt) => ({
        id: opt.id,
        label: opt.label,
        axis: opt.axis,
        points: opt.points,
        action: { type: 'event', target: 'ti-collaborator-answer' }
      })),
      onSelect: (selected) => {
        const answer = question.options.find((opt) => opt.id === selected?.id);
        if (!answer) {
          return;
        }

        this._addAxisPoints(answer.axis, answer.points);
        this._setCollaboratorAnswered(npcId, round, true);
        window.gameState?.setFlag?.(`ti_${npcId}_round_${round}_answer`, answer.id);

        if (this._areAllCollaboratorsAnswered(round)) {
          if (round === 2) {
            this._setTiJourneyCompleted(true);
            this._showTiDialog(collaboratorName, collaboratorTexts.round2CompletedDialogues || []);
          } else {
            this._showTiDialog(collaboratorName, collaboratorTexts.round1CompletedDialogues || []);
          }
          return;
        }

        this._showTiDialog(collaboratorName, collaboratorTexts.partialProgressDialogues || []);
      }
    });
  }

  setupMap() {
    console.log(`[${this.sceneKey}] Setting up TI map`);
    
    if (!this.cache.tilemap.has(this.mapKey)) {
      console.error(`[${this.sceneKey}] Tilemap "${this.mapKey}" not found!`);
      return;
    }
    
    this.map = this.make.tilemap({ key: this.mapKey });
    
    if (!this.map) {
      console.error(`[${this.sceneKey}] Failed to create tilemap!`);
      return;
    }
    
    console.log(`[${this.sceneKey}] Map created:`, {
      width: this.map.width,
      height: this.map.height,
      tileWidth: this.map.tileWidth,
      tileHeight: this.map.tileHeight
    });
    
    // Adicionar tilesets
    const allTilesets = [];
    
    this.map.tilesets.forEach(tilesetData => {
      const tilesetName = tilesetData.name;
      const textureKey = getTextureKeyForTileset(tilesetName);
      
      if (textureKey) {
        const tileset = this.map.addTilesetImage(tilesetName, textureKey);
        if (tileset) {
          allTilesets.push(tileset);
          console.log(`[${this.sceneKey}] ✓ Tileset ${tilesetName} adicionado`);
        }
      }
    });
    
    if (allTilesets.length === 0) {
      console.error(`[${this.sceneKey}] No valid tilesets!`);
      return;
    }

    // Criar camadas
    this.layers = {
      debug: this.map.createLayer('debug_numbers', allTilesets, 0, 0),
      floor: this.map.createLayer('Chão', allTilesets, 0, 0),
      walls2: this.map.createLayer('paredes2', allTilesets, 0, 0),
      walls: this.map.createLayer('Paredes', allTilesets, 0, 0),
      objects: this.map.createLayer('Objetos', allTilesets, 0, 0),
      doors: this.map.createLayer('Portas', allTilesets, 0, 0),
      objectsOver: this.map.createLayer('ObjetosSobrepostos', allTilesets, 0, 0)
    };

    // Depths
    if (this.layers.debug) this.layers.debug.setDepth(0).setAlpha(0.3);
    this.layers.floor?.setDepth(1);
    this.layers.walls?.setDepth(2);
    this.layers.walls2?.setDepth(3);
    this.layers.objects?.setDepth(4);
    this.layers.doors?.setDepth(5);
    this.layers.objectsOver?.setDepth(6);

    // Colisões
    this.layers.walls?.setCollisionByExclusion([-1]);
    this.layers.walls2?.setCollisionByExclusion([-1]);
    this.layers.objects?.setCollisionByExclusion([-1]);
    this.layers.doors?.setCollisionByExclusion([-1]);

    // Limites do mundo
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
  }

  setupDoorTransitions() {
    // Mapa Ti: 32x32 tiles de 16x16 = 512x512px
    this.doorZones = [
      new DoorZone(this, {
        x: 488,
        y: 250,
        width: 14,
        height: 66,
        label: NPC_TEXTS.itRoom?.ui?.doors?.receptionLabel,
        indicatorColor: 0xffff00,
        indicatorTextColor: '#ffff00',
        onInteract: () => this.transitionToReception(),
        proximityDistance: 50
      }),
      new DoorZone(this, {
        x: 256,
        y: 44,
        width: 64,
        height: 56,
        label: NPC_TEXTS.itRoom?.ui?.doors?.elevatorLabel,
        indicatorColor: 0x00ff00,
        indicatorTextColor: '#00ff00',
        onInteract: () => this.transitionToElevator(),
        proximityDistance: 50
      })
    ];
  }

  update(time, delta) {
    super.update(time, delta);

    if (this.player && this.doorZones) {
      this.doorZones.forEach((door) => door.update(this.player, this.input, this.tweens));
    }
  }

  transitionToReception() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log('[ItRoomScene] Transitioning to Reception...');
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.RECEPTION, {
        user: this.user,
        spawnPoint: 'fromItRoom'
      });
    });
  }

  transitionToElevator() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log('[ItRoomScene] Transitioning to Elevator...');

    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.ELEVATOR, {
        user: this.user,
        spawnPoint: 'fromItRoom'
      });
    });
  }

  getSpawnX() {
    if (this.spawnPoint === 'fromReceptionElevatorEntrance') {
      return 256;
    }
    if (this.spawnPoint === 'fromElevator') {
      return 256;
    }
    if (this.spawnPoint === 'fromReception') {
      return 256; // Centro da sala
    }
    return 256;
  }

  getSpawnY() {
    if (this.spawnPoint === 'fromReceptionElevatorEntrance') {
      return 96;
    }
    if (this.spawnPoint === 'fromElevator') {
      return 96;
    }
    if (this.spawnPoint === 'fromReception') {
      return 450; // Próximo à entrada
    }
    return 300;
  }

  setupNPCs() {
    const dialogueByNpcId = NPC_TEXTS.itRoom?.dialogues || {};
    const configs = toNpcList(IT_ROOM_NPCS_CONFIG)
      .map((cfg) => normalizeNpcConfig({
        ...cfg,
        dialogues: Array.isArray(dialogueByNpcId[cfg.id]) ? dialogueByNpcId[cfg.id] : []
      }));
    if (configs.length === 0) {
      this.npcs = [];
      console.warn('[ItRoomScene] IT NPC texts not found');
      return;
    }

    createItSitNpcAnimations(this, configs);

    const playerScale = Number.isFinite(this.player?.scaleX) && this.player.scaleX > 0
      ? this.player.scaleX
      : 1;

    this.npcs = configs.map((npcConfig) => {
      const scaleMultiplier = Number.isFinite(Number(npcConfig.scaleMultiplier))
        ? Number(npcConfig.scaleMultiplier)
        : 1;

      const npc = NPCFactory.create(this, npcConfig.x, npcConfig.y, {
        ...npcConfig,
        scale: playerScale * scaleMultiplier,
        texture: npcConfig.textureKey
      });

      const animationKey = getItSitAnimationKey(npcConfig.textureKey);
      const texture = this.textures.get(npcConfig.textureKey);
      const hasNumericFrameZero = texture?.has?.(0) === true;

      if (this.anims.exists(animationKey) && hasNumericFrameZero) {
        try {
          npc.play(animationKey, true);
        } catch (error) {
          console.warn(`[ItRoomScene] Failed to play animation ${animationKey}:`, error?.message || error);
        }
      } else {
        // Fallback seguro para evitar crash de frame inválido.
        npc.setFrame(0);
      }

      this.addCollisionsToSprite(npc, false);
      return npc;
    });

    console.log(`[ItRoomScene] Created ${this.npcs.length} IT NPCs`);
  }
}
