import { OptionFilterService } from '../OptionFilterService.js';

/**
 * ReceptionDialogueManager - Gerencia todo o sistema de diálogos condicionais da recepção
 * 
 * Responsabilidades:
 * - Aplicar textos condicionais (antes/depois de Caio)
 * - Gerenciar fluxo de diálogo (apologia, follow-up)
 * - Filtrar opções já selecionadas
 * - Construir opções com callbacks personalizados
 * 
 * Pode ser reutilizado para: gerenciar diálogos complexos em outros NPCs
 */
export class ReceptionDialogueManager {
  /**
   * @param {ReceptionScene} scene - Cena de recepção
   */
  constructor(scene) {
    this.scene = scene;
    this.filterService = new OptionFilterService('receptionist_selected_options');
    this.priorityAxisKey = 'receptionist_priority_axis';
  }

  /**
   * Aplica textos condicionais à Recepcionista baseado na ordem de contato
   */
  applyConditionalTexts(receptionist, receptionistTexts) {
    if (!receptionist) return;

    const hasTalkedToCaio = window.gameState?.getFlag?.(this.scene.caioContactFlagKey) === true;
    
    // Aplicar saudação condicional
    const greetings = receptionistTexts.greetings || {};
    receptionist.greeting = hasTalkedToCaio
      ? (greetings.afterCaio || receptionistTexts.greeting)
      : (greetings.beforeCaio || receptionistTexts.greeting);

    // Aplicar fluxo de opções apropriado
    if (!hasTalkedToCaio) {
      this._applyBeforeCaioFlow(receptionist, receptionistTexts);
    } else {
      this._applyAfterCaioFlow(receptionist, receptionistTexts);
    }
  }

  /**
   * Fluxo quando Recepcionista é contatada ANTES de Caio
   * @private
   */
  _applyBeforeCaioFlow(receptionist, receptionistTexts) {
    const flow = receptionistTexts.beforeCaioFlow || {};
    const followUpOptions = Array.isArray(flow.followUp) ? flow.followUp : [];
    
    console.log('[ReceptionDialogueManager] Applying beforeCaioFlow - Total options:', followUpOptions.length);
    
    // Filtrar opções já selecionadas
    const availableOptions = this.filterService.filterAvailableOptions(followUpOptions, 'id');
    
    console.log('[ReceptionDialogueManager] Available options after filtering:', availableOptions.map(o => o.id));
    
    // Construir opções com callbacks
    receptionist.options = availableOptions.map(config => 
      this._buildOptionWithCallback(config, receptionist, receptionistTexts)
    );
  }

  /**
   * Fluxo quando Recepcionista é contatada DEPOIS de Caio
   * @private
   */
  _applyAfterCaioFlow(receptionist, receptionistTexts) {
    const flow = receptionistTexts.afterCaioFlow || {};
    const apologyDone = window.gameState?.getFlag?.(this.scene.receptionistAfterCaioApologyFlagKey) === true;

    if (!apologyDone && flow.apology) {
      // Stage 1: Apologia
      console.log('[ReceptionDialogueManager] Showing apology option');
      receptionist.options = [
        this._buildApologyOption(flow.apology, receptionist, receptionistTexts)
      ];
      return;
    }

    // Stage 2: Follow-up options
    const followUpOptions = Array.isArray(flow.followUp) ? flow.followUp : [];
    const availableOptions = this.filterService.filterAvailableOptions(followUpOptions, 'id');
    
    console.log('[ReceptionDialogueManager] Showing follow-up options. Available:', availableOptions.map(o => o.id));
    
    receptionist.options = availableOptions.map(config =>
      this._buildOptionWithCallback(config, receptionist, receptionistTexts)
    );
  }

  /**
   * Constrói uma opção com callback personalizado
   * @private
   */
  _buildOptionWithCallback(config, receptionist, receptionistTexts) {
    const baseOption = receptionist._baseOptionsSnapshot?.find(o => o.id === config.id) || {};

    return {
      ...baseOption,
      id: config.id,
      label: config.label,
      description: config.description,
      axis: config.axis,
      action: {
        type: 'custom',
        data: {
          axis: config.axis,
          callback: ({ element, scene }) => this._handleOptionSelect(
            element,
            scene,
            config,
            receptionistTexts
          )
        }
      }
    };
  }

  /**
   * Constrói a opção de apologia
   * @private
   */
  _buildApologyOption(apologyConfig, receptionist, receptionistTexts) {
    const baseOption = receptionist._baseOptionsSnapshot?.find(o => o.id === apologyConfig.id) || {};

    return {
      ...baseOption,
      id: apologyConfig.id,
      label: apologyConfig.label,
      description: apologyConfig.description,
      axis: apologyConfig.axis,
      action: {
        type: 'custom',
        data: {
          axis: apologyConfig.axis,
          callback: ({ element, scene }) => {
            const dialogScene = scene.scene.get('DialogScene');
            if (!dialogScene) return;

            dialogScene.showDialog({
              name: receptionistTexts.name,
              dialogues: (apologyConfig.dialogues || []).map((text) => ({ text })),
              onComplete: () => {
                this.scene.setFlowFlag(this.scene.receptionistAfterCaioApologyFlagKey, true);
                this.applyConditionalTexts(element, receptionistTexts);
                element.showOptionsDialog();
              }
            });
          }
        }
      }
    };
  }

  /**
   * Handles selection of an option by user
   * @private
   */
  _handleOptionSelect(element, scene, config, receptionistTexts) {
    console.log('[ReceptionDialogueManager] Option selected:', config.id);
    
    // Marcar opção como selecionada
    this.filterService.markOptionSelected(config.id);
    
    // Registrar o eixo prioritário (apenas na primeira seleção)
    const currentAxis = window.gameState?.getFlag?.(this.priorityAxisKey);
    if (!currentAxis) {
      this.scene.setFlowFlag(this.priorityAxisKey, config.axis);
      console.log('[ReceptionDialogueManager] Priority axis registered:', config.axis);
    }
    
    // Desbloquear todos os caminhos
    if (Array.isArray(config.unlocksFlags)) {
      config.unlocksFlags.forEach(flag => {
        this.scene.setFlowFlag(flag, true);
      });
      console.log('[ReceptionDialogueManager] Unlocked flags:', config.unlocksFlags);
    }
    
    // Executar ação específica
    this._executeActionOnSelect(element, scene, config, receptionistTexts);
  }

  /**
   * Executa a ação associada à opção selecionada
   * @private
   */
  _executeActionOnSelect(element, scene, config, receptionistTexts) {
    const dialogScene = scene.scene.get('DialogScene');
    if (!dialogScene) return;

    const actionType = config.actionOnSelect?.type;
    const dialogues = (config.dialogues || []).map(text => ({ text }));

    switch (actionType) {
      case 'wait-room':
        this._showWaitRoomDialogue(dialogScene, receptionistTexts, dialogues);
        break;
      case 'event':
        this._showEventDialogue(dialogScene, receptionistTexts, dialogues, config.actionOnSelect.target);
        break;
      case 'element-unlock':
        this._showElementUnlockDialogue(dialogScene, receptionistTexts, dialogues);
        break;
      case 'mission-unlock':
        this._showMissionUnlockDialogue(dialogScene, receptionistTexts, dialogues, config.actionOnSelect.bugHint);
        break;
      default:
        this._showDefaultDialogue(dialogScene, receptionistTexts, dialogues);
    }
  }

  _showWaitRoomDialogue(dialogScene, receptionistTexts, dialogues) {
    dialogScene.showDialog({
      name: receptionistTexts.name,
      dialogues,
      onComplete: () => {
        console.log('[ReceptionDialogueManager] Opening info panel with minigame option');
      }
    });
  }

  _showEventDialogue(dialogScene, receptionistTexts, dialogues, eventTarget) {
    dialogScene.showDialog({
      name: receptionistTexts.name,
      dialogues,
      onComplete: () => {
        this.scene.events.emit(eventTarget || 'meet-it-team');
      }
    });
  }

  _showElementUnlockDialogue(dialogScene, receptionistTexts, dialogues) {
    dialogScene.showDialog({
      name: receptionistTexts.name,
      dialogues,
      onComplete: () => {
        console.log('[ReceptionDialogueManager] Form element unlocked, minigame quiz enabled');
      }
    });
  }

  _showMissionUnlockDialogue(dialogScene, receptionistTexts, dialogues, bugHint) {
    dialogScene.showDialog({
      name: receptionistTexts.name,
      dialogues,
      onComplete: () => {
        this.scene.setFlowFlag('main_mission_janus_ai_unlocked', true);
        if (bugHint) {
          console.log('[ReceptionDialogueManager] Bug hint revealed: Strange code detected in Janus AI description');
        }
      }
    });
  }

  _showDefaultDialogue(dialogScene, receptionistTexts, dialogues) {
    dialogScene.showDialog({
      name: receptionistTexts.name,
      dialogues
    });
  }
}
