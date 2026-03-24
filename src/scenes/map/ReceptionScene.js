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
    this.onboardingModalOpen = false;
    this.onboardingDialogOpen = false;
    this.onboardingModalContainer = null;
    this.modalFlowFlagKey = 'reception_intro_modal_active';
    this.dialogFlowFlagKey = 'reception_intro_dialog_active';
    this.modalSeenFlagKey = 'reception_intro_modal_seen';
    this.dialogSeenFlagKey = 'reception_intro_dialog_seen';
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
  }

  create() {
    createSitGuyAnimations(this);

    super.create(); // Chama o create da BaseMapScene

    this.registerStoryEvents();
    
    // Fade in da câmera
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Criar zona de transição para o hall (porta no fundo da recepção)
    this.setupDoorTransitions();
    
    // Registrar zonas de portas no debugger de colisão
    this.registerDoorZonesToDebugger();
    
    // Mostrar diálogo de introdução apenas no spawn inicial (não ao voltar)
    if (this.spawnPoint === 'default') {
      this.showIntroductionDialogue();
    }
    
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
          this.applyReceptionistConditionalTexts();
          this.setFlowFlag(this.receptionistContactFlagKey, true);
          this.applyCaioConditionalTexts();
          return originalInteract(trigger);
        };
        receptionist._hasContactTrackingWrapper = true;
      }

      this.applyReceptionistConditionalTexts();
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
          this.applyReceptionistConditionalTexts();
          return originalInteract(trigger);
        };
        caio._hasConditionalGreetingWrapper = true;
      }

      this.applyCaioConditionalTexts();
      this.applyReceptionistConditionalTexts();
    }
  }

  applyReceptionistConditionalTexts() {
    const receptionist = this.elementManager?.getElement?.(NPC_TEXTS.reception.receptionist.id);
    if (!receptionist) {
      return;
    }

    const receptionistTexts = NPC_TEXTS.reception.receptionist;
    const hasTalkedToCaio = window.gameState?.getFlag?.(this.caioContactFlagKey) === true;
    const conditionalGreetings = receptionistTexts.greetings || {};
    const baseOptions = Array.isArray(receptionist._baseOptionsSnapshot)
      ? receptionist._baseOptionsSnapshot
      : (receptionist.options || []);

    const buildOptionFromConfig = (config, fallbackOption = {}) => {
      const baseActionData = fallbackOption.action?.data ? { ...fallbackOption.action.data } : {};
      const option = {
        ...fallbackOption,
        id: config.id,
        label: config.label,
        description: config.description,
        axis: config.axis,
        condition: config.condition || undefined,
        action: {
          ...(fallbackOption.action || {}),
          ...(config.action || {}),
          data: {
            ...baseActionData,
            ...(config.action?.data || {}),
            ...(typeof config.axis === 'string' ? { axis: config.axis } : {})
          }
        }
      };

      if (!option.action?.type) {
        option.action = {
          type: 'dialog',
          data: {
            ...(typeof config.axis === 'string' ? { axis: config.axis } : {}),
            dialogues: (config.dialogues || []).map((text) => ({ text }))
          }
        };
      } else if (Array.isArray(config.dialogues)) {
        option.action = {
          ...option.action,
          data: {
            ...(option.action.data || {}),
            dialogues: config.dialogues.map((text) => ({ text }))
          }
        };
      }

      return option;
    };

    receptionist.greeting = hasTalkedToCaio
      ? (conditionalGreetings.afterCaio || receptionistTexts.greeting)
      : (conditionalGreetings.beforeCaio || receptionistTexts.greeting);

    if (!hasTalkedToCaio) {
      // Use beforeCaioFlow with axis-aligned options
      const flow = receptionistTexts.beforeCaioFlow || {};
      const followUpOptions = Array.isArray(flow.followUp) ? flow.followUp : [];
      
      console.log('[ReceptionScene] beforeCaioFlow - Total followUp options:', followUpOptions.length);
      console.log('[ReceptionScene] beforeCaioFlow - Following options IDs:', followUpOptions.map(o => o.id));
      
      // Get selected options from storage
      const selectedOptionsStr = window.gameState?.getFlag?.(this.receptionistSelectedOptionsKey) || '';
      const selectedOptions = selectedOptionsStr ? selectedOptionsStr.split(',').filter(Boolean) : [];
      
      console.log('[ReceptionScene] beforeCaioFlow - Selected options to filter:', selectedOptions);
      
      // Filter out already selected options
      const availableFollowUpOptions = followUpOptions.filter(config => !selectedOptions.includes(config.id));
      
      console.log('[ReceptionScene] beforeCaioFlow - Available options after filtering:', availableFollowUpOptions.map(o => o.id));
      
      receptionist.options = availableFollowUpOptions.map((config) => {
        const fallbackOption = baseOptions.find((item) => item.id === config.id) || baseOptions[0] || {};
        const builtOption = buildOptionFromConfig(config, fallbackOption);
        
        // Wrap the action to track selection and unlocks
        const originalAction = builtOption.action;
        builtOption.action = {
          type: 'custom',
          data: {
            axis: config.axis,
            callback: ({ element, scene }) => {
              console.log('[ReceptionScene] beforeCaioFlow - CALLBACK EXECUTED for option:', config.id);
              // Mark this option as selected
              const currentSelected = window.gameState?.getFlag?.(this.receptionistSelectedOptionsKey) || '';
              const newSelected = currentSelected ? `${currentSelected},${config.id}` : config.id;
              console.log('[ReceptionScene] Option selected - ID:', config.id);
              console.log('[ReceptionScene] Current selected:', currentSelected);
              console.log('[ReceptionScene] New selected:', newSelected);
              this.setFlowFlag(this.receptionistSelectedOptionsKey, newSelected);
              console.log('[ReceptionScene] Flag saved. Current value in GameState:', window.gameState?.getFlag?.(this.receptionistSelectedOptionsKey));
              
              // Register priority axis (first selection)
              const currentAxis = window.gameState?.getFlag?.(this.receptionistPriorityAxisKey);
              if (!currentAxis) {
                this.setFlowFlag(this.receptionistPriorityAxisKey, config.axis);
              }
              
              // Unlock all receptionist paths
              if (Array.isArray(config.unlocksFlags)) {
                config.unlocksFlags.forEach(flag => {
                  this.setFlowFlag(flag, true);
                });
              }
              
              // Handle specific actions
              if (config.actionOnSelect?.type === 'wait-room') {
                const dialogScene = scene.scene.get('DialogScene');
                if (dialogScene) {
                  dialogScene.showDialog({
                    name: receptionistTexts.name,
                    dialogues: (config.dialogues || []).map((text) => ({ text })),
                    onComplete: () => {
                      console.log('[ReceptionScene] Opening info panel with minigame option');
                    }
                  });
                }
              } else if (config.actionOnSelect?.type === 'event') {
                const dialogScene = scene.scene.get('DialogScene');
                if (dialogScene) {
                  dialogScene.showDialog({
                    name: receptionistTexts.name,
                    dialogues: (config.dialogues || []).map((text) => ({ text })),
                    onComplete: () => {
                      this.events.emit(config.actionOnSelect.target || 'meet-it-team');
                    }
                  });
                }
              } else if (config.actionOnSelect?.type === 'element-unlock') {
                const dialogScene = scene.scene.get('DialogScene');
                if (dialogScene) {
                  dialogScene.showDialog({
                    name: receptionistTexts.name,
                    dialogues: (config.dialogues || []).map((text) => ({ text })),
                    onComplete: () => {
                      console.log('[ReceptionScene] Form element unlocked, minigame quiz enabled');
                    }
                  });
                }
              } else if (config.actionOnSelect?.type === 'mission-unlock') {
                const dialogScene = scene.scene.get('DialogScene');
                if (dialogScene) {
                  dialogScene.showDialog({
                    name: receptionistTexts.name,
                    dialogues: (config.dialogues || []).map((text) => ({ text })),
                    onComplete: () => {
                      this.setFlowFlag('main_mission_janus_ai_unlocked', true);
                      if (config.actionOnSelect.bugHint) {
                        console.log('[ReceptionScene] Bug hint revealed: Strange code detected in Janus AI description');
                      }
                    }
                  });
                }
              } else {
                const dialogScene = scene.scene.get('DialogScene');
                if (dialogScene) {
                  dialogScene.showDialog({
                    name: receptionistTexts.name,
                    dialogues: (config.dialogues || []).map((text) => ({ text }))
                  });
                }
              }
            }
          }
        };
        
        return builtOption;
      });
      return;
    }

    const flow = receptionistTexts.afterCaioFlow || {};
    const apologyDone = window.gameState?.getFlag?.(this.receptionistAfterCaioApologyFlagKey) === true;

    if (!apologyDone && flow.apology) {
      const fallbackOption = baseOptions.find((item) => item.id === 'opt_info') || baseOptions[0] || {};
      const apologyOption = buildOptionFromConfig(flow.apology, fallbackOption);

      apologyOption.action = {
        type: 'custom',
        data: {
          axis: flow.apology.axis,
          callback: ({ element, scene }) => {
            const dialogScene = scene.scene.get('DialogScene');
            if (!dialogScene) return;

            dialogScene.showDialog({
              name: receptionistTexts.name,
              dialogues: (flow.apology.dialogues || []).map((text) => ({ text })),
              onComplete: () => {
                this.setFlowFlag(this.receptionistAfterCaioApologyFlagKey, true);
                this.applyReceptionistConditionalTexts();
                element.showOptionsDialog();
              }
            });
          }
        }
      };

      receptionist.options = [apologyOption];
      return;
    }

    const followUpOptions = Array.isArray(flow.followUp) ? flow.followUp : [];
    
    // Get selected options from storage
    const selectedOptionsStr = window.gameState?.getFlag?.(this.receptionistSelectedOptionsKey) || '';
    const selectedOptions = selectedOptionsStr ? selectedOptionsStr.split(',').filter(Boolean) : [];
    
    console.log('[ReceptionScene] afterCaioFlow - Selected options to filter:', selectedOptions);
    
    // Filter out already selected options
    const availableFollowUpOptions = followUpOptions.filter(config => !selectedOptions.includes(config.id));
    
    console.log('[ReceptionScene] afterCaioFlow - Available options after filtering:', availableFollowUpOptions.map(o => o.id));
    
    receptionist.options = availableFollowUpOptions.map((config) => {
      const fallbackOption = baseOptions.find((item) => item.id === config.id) || baseOptions[0] || {};
      const builtOption = buildOptionFromConfig(config, fallbackOption);
      
      // Wrap the action to track selection and unlocks
      const originalAction = builtOption.action;
      builtOption.action = {
        type: 'custom',
        data: {
          axis: config.axis,
          callback: ({ element, scene }) => {
              console.log('[ReceptionScene] afterCaioFlow - CALLBACK EXECUTED for option:', config.id);
            if (!currentAxis) {
              this.setFlowFlag(this.receptionistPriorityAxisKey, config.axis);
            }
            
            // Unlock all receptionist paths
            if (Array.isArray(config.unlocksFlags)) {
              config.unlocksFlags.forEach(flag => {
                this.setFlowFlag(flag, true);
              });
            }
            
            // Handle specific actions
            if (config.actionOnSelect?.type === 'wait-room') {
              const dialogScene = scene.scene.get('DialogScene');
              if (dialogScene) {
                dialogScene.showDialog({
                  name: receptionistTexts.name,
                  dialogues: (config.dialogues || []).map((text) => ({ text })),
                  onComplete: () => {
                    // Show info panel with minigame option
                    console.log('[ReceptionScene] Opening info panel with minigame option');
                  }
                });
              }
            } else if (config.actionOnSelect?.type === 'event') {
              const dialogScene = scene.scene.get('DialogScene');
              if (dialogScene) {
                dialogScene.showDialog({
                  name: receptionistTexts.name,
                  dialogues: (config.dialogues || []).map((text) => ({ text })),
                  onComplete: () => {
                    // Trigger event
                    this.events.emit(config.actionOnSelect.target || 'meet-it-team');
                  }
                });
              }
            } else if (config.actionOnSelect?.type === 'element-unlock') {
              const dialogScene = scene.scene.get('DialogScene');
              if (dialogScene) {
                dialogScene.showDialog({
                  name: receptionistTexts.name,
                  dialogues: (config.dialogues || []).map((text) => ({ text })),
                  onComplete: () => {
                    // Unlock form element
                    console.log('[ReceptionScene] Form element unlocked, minigame quiz enabled');
                  }
                });
              }
            } else if (config.actionOnSelect?.type === 'mission-unlock') {
              const dialogScene = scene.scene.get('DialogScene');
              if (dialogScene) {
                dialogScene.showDialog({
                  name: receptionistTexts.name,
                  dialogues: (config.dialogues || []).map((text) => ({ text })),
                  onComplete: () => {
                    // Unlock main mission
                    this.setFlowFlag('main_mission_janus_ai_unlocked', true);
                    if (config.actionOnSelect.bugHint) {
                      console.log('[ReceptionScene] Bug hint revealed: Strange code detected in Janus AI description');
                    }
                  }
                });
              }
            } else {
              // Default action handling
              const dialogScene = scene.scene.get('DialogScene');
              if (dialogScene) {
                dialogScene.showDialog({
                  name: receptionistTexts.name,
                  dialogues: (config.dialogues || []).map((text) => ({ text }))
                });
              }
            }
          }
        }
      };
      
      return builtOption;
    });
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
        label: RECEPTION_TEXTS.doors.elevatorLabel,
        indicatorColor: 0xff7777,
        indicatorTextColor: '#ffcccc',
        indicatorOffsetX: -14,
        locked: true,
        lockedMessage: RECEPTION_TEXTS.doors.elevatorLockedMessage,
        onInteract: () => {},
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
    // Esperar o fade in completar antes de mostrar o diálogo
    this.time.delayedCall(600, () => {
      const modalSeen = window.gameState?.getFlag?.(this.modalSeenFlagKey) === true;
      const dialogSeen = window.gameState?.getFlag?.(this.dialogSeenFlagKey) === true;

      if (!modalSeen) {
        this.showPreWelcomeModal(() => {
          if (!dialogSeen) {
            this.startWelcomeDialog();
          }
        });
        return;
      }

      if (!dialogSeen) {
        this.startWelcomeDialog();
      }
    });
  }

  startWelcomeDialog() {
    if (this.onboardingModalOpen) {
      return;
    }

    const dialogScene = this.scene.get('DialogScene');

    console.log('[ReceptionScene] Trying to show intro dialogue');
    console.log('[ReceptionScene] DialogScene:', dialogScene);
    console.log('[ReceptionScene] DialogScene active?', this.scene.isActive('DialogScene'));

    if (dialogScene && this.scene.isActive('DialogScene')) {
      this.onboardingDialogOpen = true;
      this.setFlowFlag(this.dialogFlowFlagKey, true);

      const introData = {
        name: RECEPTION_TEXTS.introDialog.name,
        dialogues: RECEPTION_TEXTS.introDialog.dialogues.map((text, index) => ({
          text,
          emotion: index === 1 ? 'determined' : 'neutral'
        })),
        onComplete: () => {
          this.onboardingDialogOpen = false;
          this.setFlowFlag(this.dialogFlowFlagKey, false);
          this.setFlowFlag(this.dialogSeenFlagKey, true);
        }
      };

      dialogScene.showDialog(introData);
      console.log('[ReceptionScene] Introduction dialogue started');
    } else {
      this.onboardingDialogOpen = false;
      this.setFlowFlag(this.dialogFlowFlagKey, false);
      console.error('[ReceptionScene] DialogScene not found or not active!');
    }
  }

  setFlowFlag(flagKey, value) {
    if (window.gameState?.setFlag && flagKey) {
      window.gameState.setFlag(flagKey, value === true);
    }
  }

  isInteractionBlocked() {
    return this.onboardingModalOpen || this.onboardingDialogOpen;
  }

  showPreWelcomeModal(onContinue) {
    if (this.onboardingModalOpen) {
      return;
    }

    this.onboardingModalOpen = true;
    this.setFlowFlag(this.modalFlowFlagKey, true);
    this.playerController && (this.playerController.enabled = false);

    const camera = this.cameras.main;
    const width = camera.width;
    const height = camera.height;
    const container = this.add.container(0, 0).setDepth(25000).setScrollFactor(0);

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72)
      .setScrollFactor(0)
      .setInteractive();
    overlay.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
    });

    const panel = this.add.rectangle(
      width / 2,
      height / 2,
      Math.min(550, Math.max(320, width * 0.9)),
      Math.min(260, Math.max(260, height * 0.86)),
      0x10172a,
      0.98
    )
      .setStrokeStyle(3, 0x00d9ff)
      .setScrollFactor(0)
      .setInteractive();
    panel.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
    });

    const title = this.add.text(width / 2, panel.y - panel.height / 2 + 18, RECEPTION_TEXTS.modal.title, {
      fontSize: '20px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0);

    const pages = RECEPTION_TEXTS.modal.pages;

    let pageIndex = 0;
    const body = this.add.text(panel.x - panel.width / 2 + 24, title.y + 42, pages[0],
      {
        fontSize: '16px',
        color: '#e6f4ff',
        wordWrap: { width: panel.width - 48 },
        lineSpacing: 5
      }
    ).setOrigin(0, 0).setScrollFactor(0);

    const pageCounter = this.add.text(panel.x, panel.y + panel.height / 2 - 42, `1/${pages.length}`, {
      fontSize: '15px',
      color: '#9cc4ff'
    }).setOrigin(0.5).setScrollFactor(0);

    const prevButton = this.add.text(panel.x - 92, panel.y + panel.height / 2 - 42, RECEPTION_TEXTS.modal.previousButton, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#2a3f6b',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

    const nextButton = this.add.text(panel.x + 92, panel.y + panel.height / 2 - 42, RECEPTION_TEXTS.modal.nextButton, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#2a3f6b',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

    const button = this.add.text(width / 2, panel.y + panel.height / 2 - 42, RECEPTION_TEXTS.modal.continueButton, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#2a3f6b',
      padding: { x: 18, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

    button.setVisible(false);

    const updatePage = () => {
      body.setText(pages[pageIndex]);
      pageCounter.setText(`${pageIndex + 1}/${pages.length}`);

      prevButton.setAlpha(pageIndex === 0 ? 0.45 : 1);
      button.setVisible(pageIndex === pages.length - 1);
      pageCounter.setVisible(pageIndex !== pages.length - 1);
      prevButton.setVisible(pageIndex !== pages.length - 1);
      nextButton.setVisible(pageIndex !== pages.length - 1);
    };

    button.on('pointerover', () => button.setBackgroundColor('#36548f'));
    button.on('pointerout', () => button.setBackgroundColor('#2a3f6b'));
    prevButton.on('pointerover', () => prevButton.setBackgroundColor('#36548f'));
    prevButton.on('pointerout', () => prevButton.setBackgroundColor('#2a3f6b'));
    nextButton.on('pointerover', () => nextButton.setBackgroundColor('#36548f'));
    nextButton.on('pointerout', () => nextButton.setBackgroundColor('#2a3f6b'));

    const closeModal = () => {
      if (!this.onboardingModalOpen) return;
      this.onboardingModalOpen = false;
      this.setFlowFlag(this.modalFlowFlagKey, false);
      this.setFlowFlag(this.modalSeenFlagKey, true);

      if (this._onboardingContinueKey && this._onboardingSpaceHandler) {
        this._onboardingContinueKey.off('down', this._onboardingSpaceHandler);
      }
      if (this._onboardingPrevKey && this._onboardingPrevHandler) {
        this._onboardingPrevKey.off('down', goPrevPage);
      }
      if (this._onboardingNextKey && this._onboardingNextHandler) {
        this._onboardingNextKey.off('down', goNextPage);
      }

      this._onboardingSpaceHandler = null;
      this._onboardingPrevHandler = null;
      this._onboardingNextHandler = null;

      this.onboardingModalContainer?.destroy(true);
      this.onboardingModalContainer = null;

      if (typeof onContinue === 'function') {
        onContinue();
      }
    };

    const goPrevPage = () => {
      if (pageIndex > 0) {
        pageIndex -= 1;
        updatePage();
      }
    };

    const goNextPage = () => {
      if (pageIndex < pages.length - 1) {
        pageIndex += 1;
        updatePage();
      }
    };

    button.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
      closeModal();
    });
    prevButton.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
      goPrevPage();
    });
    nextButton.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
      goNextPage();
    });

    this._onboardingContinueKey = this.input.keyboard.addKey('SPACE');
    this._onboardingPrevKey = this.input.keyboard.addKey('LEFT');
    this._onboardingNextKey = this.input.keyboard.addKey('RIGHT');

    this._onboardingSpaceHandler = () => {
      if (pageIndex === pages.length - 1) {
        closeModal();
      } else {
        goNextPage();
      }
    };
    this._onboardingPrevHandler = goPrevPage;
    this._onboardingNextHandler = goNextPage;

    this._onboardingContinueKey.on('down', this._onboardingSpaceHandler);
    this._onboardingPrevKey.on('down', this._onboardingPrevHandler);
    this._onboardingNextKey.on('down', this._onboardingNextHandler);

    updatePage();
    container.add([overlay, panel, title, body, pageCounter, prevButton, nextButton, button]);
    this.onboardingModalContainer = container;
  }
}
