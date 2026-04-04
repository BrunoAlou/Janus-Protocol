import BaseMapScene from './BaseMapScene.js';
import loadPlayerAssets from '../../player/loadPlayerAssets.js';
import { SCENE_NAMES } from '../../constants/SceneNames.js';
import DoorZone from '../../components/DoorZone.js';
import { preloadRegisteredTilesets } from '../../constants/TilesetAssets.js';
import {
  createSitGuyAnimations,
  loadSitGuyAssets
} from '../../npcs/sitGuyAnimations.js';
import { RECEPTION_TEXTS } from '../../i18n/receptionTexts.js';
import { NPC_TEXTS } from '../../i18n/npcTexts.js';
import { ReceptionDialogueManager } from './services/reception/ReceptionDialogueManager.js';
import { ReceptionIntroducer } from './services/reception/ReceptionIntroducer.js';

/**
 * ReceptionScene - Cena da recepção (antiga GameScene)
 */
export default class ReceptionScene extends BaseMapScene {
  constructor() {
    super(SCENE_NAMES.RECEPTION, 'reception');
  }

  preload() {
    console.log('[ReceptionScene] Preload started');
    
    // Carregar assets do player
    loadPlayerAssets(this);
    
    // Carregar tilesets de forma padronizada pelo registro central
    preloadRegisteredTilesets(this);
    // Carregar mapa via resolver compatível com Vite/GitHub Pages
    super.preload();
    loadSitGuyAssets(this);
    
    console.log('[ReceptionScene] Preload finished - loading reception map');
  }

  init(data) {
    super.init(data);
    this.spawnPoint = data.spawnPoint || 'default';
    this.isTransitioning = false; // Reset flag de transição
    this._introFlowScheduled = false;
    this._introFlowStarted = false;
    this.onboardingModalOpen = false;
    this.onboardingDialogOpen = false;
    this.onboardingModalContainer = null;
    this.modalFlowFlagKey = 'reception_intro_modal_active';
    this.dialogFlowFlagKey = 'reception_intro_dialog_active';
    this.modalSeenFlagKey = 'reception_intro_modal_seen';
    this.dialogSeenFlagKey = 'reception_intro_dialog_seen';
    this.archiveDoorUnlockFlagKey = 'reception_archive_door_unlocked';
    this.receptionistContactFlagKey =
      NPC_TEXTS.reception.receptionist.contactFlagKey || `contacted_${NPC_TEXTS.reception.receptionist.id}`;
    this.caioContactFlagKey =
      NPC_TEXTS.reception.caio.contactFlagKey || `contacted_${NPC_TEXTS.reception.caio.id}`;
    this.receptionistAfterCaioApologyFlagKey = 'receptionist_after_caio_apology_done';
    this.receptionistSelectedOptionsKey = 'receptionist_selected_options';
    this.receptionistPriorityAxisKey = 'receptionist_priority_axis';
    this.legacyReceptionistContactFlagKey = 'contacted_receptionist';
    this.setFlowFlag(this.modalFlowFlagKey, false);
    this.setFlowFlag(this.dialogFlowFlagKey, false);

    if (window.gameState?.getFlag?.(this.modalSeenFlagKey) === undefined) {
      this.setFlowFlag(this.modalSeenFlagKey, false);
    }
    if (window.gameState?.getFlag?.(this.dialogSeenFlagKey) === undefined) {
      this.setFlowFlag(this.dialogSeenFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.receptionistContactFlagKey) === undefined) {
      const legacyValue = window.gameState?.getFlag?.(this.legacyReceptionistContactFlagKey) === true;
      this.setFlowFlag(this.receptionistContactFlagKey, legacyValue);
    }

    if (window.gameState?.getFlag?.(this.receptionistAfterCaioApologyFlagKey) === undefined) {
      this.setFlowFlag(this.receptionistAfterCaioApologyFlagKey, false);
    }

    if (window.gameState?.getFlag?.(this.receptionistSelectedOptionsKey) === undefined) {
      this.setFlowFlag(this.receptionistSelectedOptionsKey, '');
    }

    if (window.gameState?.getFlag?.(this.receptionistPriorityAxisKey) === undefined) {
      this.setFlowFlag(this.receptionistPriorityAxisKey, null);
    }

    if (window.gameState?.getFlag?.(this.archiveDoorUnlockFlagKey) === undefined) {
      this.setFlowFlag(this.archiveDoorUnlockFlagKey, false);
    }
  }

  create() {
    createSitGuyAnimations(this);

    super.create(); // Chama o create da BaseMapScene
    window.gameState?.setFlag?.('checkpoint_reception_visited', true);

    this.registerStoryEvents();
    
    // Fade in da câmera
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Criar zona de transição para o hall (porta no fundo da recepção)
    this.setupDoorTransitions();
    
    // Registrar zonas de portas no debugger de colisão
    this.registerDoorZonesToDebugger();
    
    // Sempre avaliar onboarding na entrada da recepção.
    // A própria introdução decide por flags se deve exibir ou não.
    this.showIntroductionDialogue();
    
    console.log('[ReceptionScene] Reception loaded, spawn:', this.spawnPoint);
  }

  registerStoryEvents() {
    this.events.on('meet-it-team', () => {
      if (window.gameState?.setFlag) {
        window.gameState.setFlag('met_it_team', true);
        window.gameState.setFlag('reception_ti_door_unlocked', true);
      }

      this.applyCaioConditionalTexts();

      const dialogScene = this.scene.get('DialogScene');
      if (dialogScene && this.scene.isActive('DialogScene')) {
        dialogScene.showDialog({
          name: NPC_TEXTS.reception.receptionist.name,
          dialogues: NPC_TEXTS.reception.receptionist.itTeamUnlockedDialogues.map((text) => ({ text }))
        });
      }
    });

    this.events.on('read-magazine-topic', (eventData = {}) => {
      const { axis, title, dialogues, elementId } = eventData;
      const axisName = typeof axis === 'string' ? axis : null;

      if (axisName && typeof window.gameState?.appendAxisChoiceEntry === 'function') {
        window.gameState.appendAxisChoiceEntry({
          axis: axisName,
          source: title || 'Stand de Revistas',
          sourceId: elementId || 'magazine_stand',
          label: title || 'Leitura de revista',
          optionId: eventData?.option?.id || null,
          scene: this.scene?.key || null,
          influenceType: 'magazine_topic'
        });
      }

      if (axisName && window.gameState?.setStat && window.gameState?.getStat) {
        const statKey = `axis_points_${axisName}`;
        const currentPoints = Number(window.gameState.getStat(statKey) || 0);
        window.gameState.setStat(statKey, currentPoints + 1);
      }

      if (axisName) {
        const currentPriorityAxis = window.gameState?.getFlag?.(this.receptionistPriorityAxisKey);
        if (!currentPriorityAxis) {
          this.setFlowFlag(this.receptionistPriorityAxisKey, axisName);
        }
      }

      const element = elementId ? this.elementManager?.getElement?.(elementId) : null;
      const dialogScene = this.scene.get('DialogScene');
      if (!dialogScene || !this.scene.isActive('DialogScene')) {
        element?.endInteraction?.();
        return;
      }

      const safeDialogues = Array.isArray(dialogues) && dialogues.length > 0
        ? dialogues
        : [{ text: 'Voce folheia rapidamente, mas nao encontra nada relevante agora.' }];

      dialogScene.showDialog({
        name: title || 'Stand de Revistas',
        dialogues: safeDialogues,
        onComplete: () => {
          element?.endInteraction?.();
        }
      });
    });

    this.events.on('unlock-archive-room', () => {
      this.setFlowFlag(this.archiveDoorUnlockFlagKey, true);

      const dialogScene = this.scene.get('DialogScene');
      if (dialogScene && this.scene.isActive('DialogScene')) {
        dialogScene.showDialog({
          name: NPC_TEXTS.reception.receptionist.name,
          dialogues: [{ text: 'Acesso liberado. A sala de arquivo ja esta disponivel.' }]
        });
      }
    });
  }

  async setupElements() {
    await super.setupElements();
    this.applyReceptionNpcTranslations();
  }

  applyReceptionNpcTranslations() {
    const receptionist = this.elementManager?.getElement?.(NPC_TEXTS.reception.receptionist.id);
    if (receptionist) {
      const receptionistTexts = NPC_TEXTS.reception.receptionist;
      receptionist.name = receptionistTexts.name;
      receptionist.description = receptionistTexts.description;
      receptionist.greeting = receptionistTexts.greeting;

      if (!receptionist._baseOptionsSnapshot) {
        receptionist._baseOptionsSnapshot = (receptionist.options || []).map((item) => ({
          ...item,
          action: item.action
            ? {
                ...item.action,
                data: item.action.data ? { ...item.action.data } : undefined
              }
            : undefined,
          condition: item.condition ? { ...item.condition } : undefined
        }));
      }

      this.applyNpcOptionTranslation(receptionist, receptionistTexts.options.info);
      this.applyNpcOptionTranslation(receptionist, receptionistTexts.options.directions);
      this.applyNpcOptionTranslation(receptionist, receptionistTexts.options.meetItTeam);
      this.applyNpcOptionTranslation(receptionist, receptionistTexts.options.scheduleMeeting);
      this.applyNpcOptionTranslation(receptionist, receptionistTexts.options.bye);

      if (!receptionist._hasContactTrackingWrapper) {
        const originalInteract = receptionist.interact.bind(receptionist);
        receptionist.interact = (trigger = 'manual') => {
          // Use novo manager para aplicar textos condicionais
          if (!this.dialogueManager) {
            this.dialogueManager = new ReceptionDialogueManager(this);
          }
          this.dialogueManager.applyConditionalTexts(receptionist, receptionistTexts);
          this.setFlowFlag(this.receptionistContactFlagKey, true);
          this.applyCaioConditionalTexts();
          return originalInteract(trigger);
        };
        receptionist._hasContactTrackingWrapper = true;
      }

      // Aplicar textos iniciais
      if (!this.dialogueManager) {
        this.dialogueManager = new ReceptionDialogueManager(this);
      }
      this.dialogueManager.applyConditionalTexts(receptionist, receptionistTexts);
    }

    const caio = this.elementManager?.getElement?.(NPC_TEXTS.reception.caio.id);
    if (caio) {
      const caioTexts = NPC_TEXTS.reception.caio;
      caio.name = caioTexts.name;
      caio.description = caioTexts.description;

      if (!caio._hasConditionalGreetingWrapper) {
        const originalInteract = caio.interact.bind(caio);
        caio.interact = (trigger = 'manual') => {
          this.applyCaioConditionalTexts();
          if (!this.dialogueManager) {
            this.dialogueManager = new ReceptionDialogueManager(this);
          }
          const receptionistTexts = NPC_TEXTS.reception.receptionist;
          const receptionist = this.elementManager?.getElement?.(NPC_TEXTS.reception.receptionist.id);
          if (receptionist) {
            this.dialogueManager.applyConditionalTexts(receptionist, receptionistTexts);
          }
          return originalInteract(trigger);
        };
        caio._hasConditionalGreetingWrapper = true;
      }

      this.applyCaioConditionalTexts();
    }
  }

  applyNpcOptionTranslation(element, optionTexts) {
    if (!element || !optionTexts?.id) {
      return;
    }

    const option = element.options?.find((item) => item.id === optionTexts.id);
    if (!option) {
      return;
    }

    if (typeof optionTexts.label === 'string') {
      option.label = optionTexts.label;
    }

    if (typeof optionTexts.description === 'string') {
      option.description = optionTexts.description;
    }

    if (typeof optionTexts.axis === 'string') {
      option.axis = optionTexts.axis;
    }

    if (Array.isArray(optionTexts.dialogues)) {
      option.action = {
        ...option.action,
        type: 'dialog',
        data: {
          ...(option.action?.data || {}),
          ...(typeof optionTexts.axis === 'string' ? { axis: optionTexts.axis } : {}),
          dialogues: optionTexts.dialogues.map((text) => ({ text }))
        }
      };
    }
  }

  applyCaioConditionalTexts() {
    const caio = this.elementManager?.getElement?.(NPC_TEXTS.reception.caio.id);
    if (!caio) {
      return;
    }

    const caioTexts = NPC_TEXTS.reception.caio;
    const receptionistFlowDone = window.gameState?.getFlag?.(this.receptionistContactFlagKey) === true;

    caio.greeting = receptionistFlowDone
      ? caioTexts.greetings.afterReceptionist
      : caioTexts.greetings.beforeReceptionist;

    const originalOptions = Array.isArray(caio.options) ? caio.options : [];
    const queueTemplate =
      originalOptions.find((item) => item.id === 'opt_sit_guy_queue') ||
      originalOptions.find((item) => item.id === caioTexts.options.bye.id) ||
      originalOptions[0] ||
      { action: { type: 'dialog', data: {} } };

    const conversationOptions = (caioTexts.options.conversation || []).map((conversationOption) => {
      const baseOption =
        originalOptions.find((item) => item.id === conversationOption.id) ||
        queueTemplate;

      const optionDialogues = receptionistFlowDone
        ? conversationOption.dialogues.afterReceptionist
        : conversationOption.dialogues.beforeReceptionist;

      return {
        ...baseOption,
        id: conversationOption.id,
        label: receptionistFlowDone
          ? (conversationOption.labels?.afterReceptionist || conversationOption.label)
          : (conversationOption.labels?.beforeReceptionist || conversationOption.label),
        axis: conversationOption.axis,
        action: {
          ...baseOption.action,
          type: 'dialog',
          data: {
            ...(baseOption.action?.data || {}),
            ...(typeof conversationOption.axis === 'string' ? { axis: conversationOption.axis } : {}),
            dialogues: optionDialogues.map((text) => ({ text }))
          }
        }
      };
    });

    caio.options = conversationOptions;

    const existingByeOption =
      originalOptions.find((item) => item.id === caioTexts.options.bye.id) ||
      queueTemplate;
    const byeOption = {
      ...existingByeOption,
      id: caioTexts.options.bye.id,
      label: caioTexts.options.bye.label,
      axis: caioTexts.options.bye.axis,
      action: {
        ...existingByeOption.action,
        type: 'dialog',
        data: {
          ...(existingByeOption.action?.data || {}),
          ...(typeof caioTexts.options.bye.axis === 'string' ? { axis: caioTexts.options.bye.axis } : {}),
          dialogues: caioTexts.options.bye.dialogues.map((text) => ({ text }))
        }
      }
    };

    caio.options.push(byeOption);
  }

  update() {
    // Chamar update da classe pai para manter movimento do player
    super.update();
    if (this.player && this.doorZones) {
      this.doorZones.forEach(door => door.update(this.player, this.input, this.tweens));
    }
  }

  setupNPCs() {
    // Reception usa NPCs interativos via ElementManager (reception.json).
    // Evita duplicar sprites da object layer do Tiled.
    this.npcs = [];
  }

  setupDoorTransitions() {
    this.doorZones = [
      new DoorZone(this, {
        x: 624,
        y: 240,
        width: 16,
        height: 64,
        label: RECEPTION_TEXTS.doors.archiveAccessLabel,
        indicatorColor: 0xff7777,
        indicatorTextColor: '#ffcccc',
        indicatorOffsetX: -14,
        locked: true,
        lockedCondition: () => window.gameState?.getFlag?.(this.archiveDoorUnlockFlagKey) !== true,
        lockedMessageResolver: () => RECEPTION_TEXTS.doors.archiveLockedMessage,
        onInteract: () => this.transitionToArchiveRoom(),
        proximityDistance: 50
      }),
      new DoorZone(this, {
        x: 16, y: 240, width: 16, height: 64,
        label: RECEPTION_TEXTS.doors.itRoomLabel,
        indicatorColor: 0x00ffff,
        indicatorTextColor: '#00ffff',
        labelBg: '#000066',
        indicatorOffsetX: 14,
        locked: true,
        lockedCondition: () => {
          const unlocked =
            window.gameState?.getFlag?.('reception_ti_door_unlocked') === true ||
            window.gameState?.getFlag?.('met_it_team') === true;
          return !unlocked;
        },
        lockedMessageResolver: () =>
          RECEPTION_TEXTS.doors.itRoomLockedMessage,
        onInteract: () => this.transitionToItRoom(),
        proximityDistance: 50
      })
    ];
    console.log('[ReceptionScene] Door transitions: Elevator (locked), IT Room (conditional)');
  }

  transitionToArchiveRoom() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log('[ReceptionScene] Transitioning to Archive Room...');

    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.ARCHIVE_ROOM, {
        user: this.user,
        spawnPoint: 'fromReception'
      });
    });
  }

  transitionToItRoom() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    console.log('[ReceptionScene] Transitioning to IT Room...');
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      window.sceneManager.goToMap(SCENE_NAMES.IT_ROOM, {
        user: this.user,
        spawnPoint: 'fromReception'
      });
    });
  }

  getSpawnX() {
    // Ajustar spawn baseado de onde o player veio
    if (this.spawnPoint === 'fromItRoom') {
      return 50; // Próximo à porta esquerda
    }
    return 336; // Posição inicial (default)
  }

  getSpawnY() {
    if (this.spawnPoint === 'fromItRoom') {
      return 240; // Meio da porta esquerda
    }
    return 469; // Posição inicial na recepção (default)
  }

  /**
   * Mostrar diálogo de introdução ao chegar na recepção
   */
  showIntroductionDialogue() {
    if (this._introFlowScheduled || this._introFlowStarted) {
      return;
    }

    const modalSeen = window.gameState?.getFlag?.(this.modalSeenFlagKey) === true;
    const dialogSeen = window.gameState?.getFlag?.(this.dialogSeenFlagKey) === true;

    console.log('[ReceptionScene] showIntroductionDialogue called', {
      spawnPoint: this.spawnPoint,
      modalSeen,
      dialogSeen
    });

    this._introFlowScheduled = true;

    const runIntroFlow = () => {
      if (this._introFlowStarted) {
        return;
      }

      if (!this.sys?.isActive?.()) {
        window.setTimeout(runIntroFlow, 120);
        return;
      }

      this._introFlowStarted = true;
      this._introFlowScheduled = false;

      if (!this.introducer) {
        this.introducer = new ReceptionIntroducer(this);
      }

      this.introducer.showIntroductionFlow();
    };

    // Trigger principal no clock da cena.
    this.time.delayedCall(600, runIntroFlow);

    // Fallback para cenários em que o timer da cena não dispara no boot.
    window.setTimeout(runIntroFlow, 900);
  }

  setFlowFlag(flagKey, value) {
    if (window.gameState?.setFlag && flagKey) {
      window.gameState.setFlag(flagKey, value);
    }
  }

  isInteractionBlocked() {
    return this.onboardingModalOpen || this.onboardingDialogOpen;
  }
}
