import Phaser from 'phaser';
import { SCENE_NAMES } from '../constants/SceneNames.js';

/**
 * DialogScene - Hub de conversas na parte inferior
 * Suporta diálogos sequenciais e menus de opções interativos
 */
export default class DialogScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_NAMES.DIALOG, active: false });
    this.currentDialogue = null;
    this.dialogueIndex = 0;
    this.isTyping = false;
    
    // Timer de digitação (para poder cancelar)
    this.typeTimer = null;
    
    // Texto completo atual (para skip de animação)
    this.currentFullText = '';
    
    // Callback quando diálogo termina
    this.onDialogCompleteCallback = null;
    
    // Estado para menu de opções
    this.optionsMode = false;
    this.currentOptions = null;
    this.optionButtons = [];
    this.selectedOptionIndex = 0;
    this.onSelectCallback = null;
    this.onCloseCallback = null;
    
    // Scroll de opções
    this.visibleStartIndex = 0;
    this.maxVisibleOptions = 3;
    this.scrollUpIndicator = null;
    this.scrollDownIndicator = null;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Container principal do diálogo - posicionado no footer (x=0, ocupa 100% width)
    const dialogHeight = 160;
    this.dialogContainer = this.add.container(0, height - dialogHeight);
    this.dialogContainer.setDepth(1000);
    this.dialogContainer.setVisible(false);

    // Fundo do diálogo (100% width, posicionado no footer)
    const dialogBg = this.add.rectangle(
      width / 2,
      dialogHeight / 2,
      width,  // 100% da largura
      dialogHeight,
      0x000000,
      0.92
    );
    dialogBg.setStrokeStyle(3, 0x00d9ff);

    // Nome do NPC
    this.npcNameText = this.add.text(24, 16, '', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#00d9ff',
      fontStyle: 'bold'
    });

    // Texto do diálogo
    this.dialogText = this.add.text(24, 48, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: width - 60 },
      lineSpacing: 6
    });

    // Indicador de continuação (canto inferior direito)
    this.continueIndicator = this.add.text(
      width - 24,
      dialogHeight - 24,
      '▼ ESPAÇO',
      {
        fontSize: '12px',
        color: '#ffff00',
        fontStyle: 'bold'
      }
    ).setOrigin(1, 1);
    this.continueIndicator.setVisible(false);

    // Botão fechar (X) - canto superior direito
    const closeButton = this.add.text(width - 24, 16, '✕', {
      fontSize: '22px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    
    closeButton.on('pointerdown', () => this.closeDialog());
    closeButton.on('pointerover', () => closeButton.setColor('#ff5555'));
    closeButton.on('pointerout', () => closeButton.setColor('#ff0000'));

    this.dialogContainer.add([
      dialogBg,
      this.npcNameText,
      this.dialogText,
      this.continueIndicator,
      closeButton
    ]);

    // ============================================
    // CONTAINER DE OPÇÕES (para menu interativo)
    // ============================================
    const optionsHeight = 180;
    this.optionsContainerHeight = optionsHeight;
    this.optionsContainer = this.add.container(0, height - optionsHeight);
    this.optionsContainer.setDepth(1001);
    this.optionsContainer.setVisible(false);

    // Fundo do menu de opções (100% width, posicionado no footer)
    const optionsBg = this.add.rectangle(
      width / 2,
      optionsHeight / 2,
      width,  // 100% da largura
      optionsHeight,
      0x000000,
      0.92
    );
    optionsBg.setStrokeStyle(3, 0x00d9ff);

    // Título do menu
    this.optionsTitle = this.add.text(24, 12, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#00d9ff',
      fontStyle: 'bold'
    });

    // Texto de saudação/greeting
    this.greetingText = this.add.text(24, 34, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: width - 60 }
    });

    // Indicador de scroll para cima
    this.scrollUpIndicator = this.add.text(width - 40, 36, '▲', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // Indicador de scroll para baixo
    this.scrollDownIndicator = this.add.text(width - 40, optionsHeight - 16, '▼', {
      fontSize: '14px',
      color: '#ffff00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);

    // Botão fechar opções (X) - canto superior direito
    const closeOptionsButton = this.add.text(width - 24, 12, '✕', {
      fontSize: '20px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    
    closeOptionsButton.on('pointerdown', () => this.closeOptionsDialog());
    closeOptionsButton.on('pointerover', () => closeOptionsButton.setColor('#ff5555'));
    closeOptionsButton.on('pointerout', () => closeOptionsButton.setColor('#ff0000'));

    this.optionsContainer.add([
      optionsBg,
      this.optionsTitle,
      this.greetingText,
      this.scrollUpIndicator,
      this.scrollDownIndicator,
      closeOptionsButton
    ]);

    // Tecla ESPAÇO para avançar diálogo
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.spaceKey.on('down', () => this.advanceDialogue());

    // Tecla ESC para fechar diálogos
    this.escKey = this.input.keyboard.addKey('ESC');
    this.escKey.on('down', () => this.handleEscapeKey());

    // Teclas para navegação de opções
    this.upKey = this.input.keyboard.addKey('UP');
    this.downKey = this.input.keyboard.addKey('DOWN');
    this.enterKey = this.input.keyboard.addKey('ENTER');

    this.upKey.on('down', () => this.navigateOptions(-1));
    this.downKey.on('down', () => this.navigateOptions(1));
    this.enterKey.on('down', () => this.selectCurrentOption());

    console.log('[DialogScene] Created');
  }

  /**
   * Processa a tecla ESC - fecha diálogos ou menu de opções
   */
  /**
   * Verifica se há diálogo ou opções abertas
   * @returns {boolean}
   */
  isDialogOpen() {
    return this.dialogContainer?.visible || this.optionsContainer?.visible || false;
  }

  handleEscapeKey() {
    // Se menu de opções está aberto, fechar ele
    if (this.optionsMode && this.optionsContainer.visible) {
      // Marcar que ESC foi consumido (para PauseMenuScene ignorar)
      this._escConsumed = true;
      this.time.delayedCall(50, () => { this._escConsumed = false; });
      this.closeOptionsDialog();
      return;
    }

    // Se diálogo está aberto, fechar ele
    if (this.dialogContainer.visible) {
      // Marcar que ESC foi consumido (para PauseMenuScene ignorar)
      this._escConsumed = true;
      this.time.delayedCall(50, () => { this._escConsumed = false; });
      this.closeDialog();
      return;
    }
  }

  /**
   * Mostra diálogo do NPC
   */
  showDialog(data) {
    console.log('[DialogScene] showDialog called with data:', data);
    console.log('[DialogScene] dialogContainer visible before:', this.dialogContainer.visible);
    
    // Trazer DialogScene para o topo
    this.scene.bringToTop();
    console.log('[DialogScene] Scene brought to top');
    
    this.currentDialogue = data.dialogues;
    this.dialogueIndex = 0;
    this.npcNameText.setText(data.name);
    
    // Guardar callback de conclusão
    this.onDialogCompleteCallback = data.onComplete || null;
    
    this.dialogContainer.setVisible(true);
    console.log('[DialogScene] dialogContainer visible after:', this.dialogContainer.visible);
    
    this.displayCurrentDialogue();

    // Pausar movimentação do player - buscar cena ativa do jogo
    const activeGameScene = this.getActiveGameScene();
    if (activeGameScene?.playerController) {
      console.log('[DialogScene] Disabling player controller, current state:', activeGameScene.playerController.enabled);
      activeGameScene.playerController.enabled = false;
      console.log('[DialogScene] Player controller disabled on:', activeGameScene.scene.key, '- new state:', activeGameScene.playerController.enabled);
    } else {
      console.warn('[DialogScene] Could not find active game scene or player controller!');
    }

    console.log('[DialogScene] Showing dialog from:', data.name);
  }

  /**
   * Exibe o diálogo atual com efeito de digitação
   */
  displayCurrentDialogue() {
    if (!this.currentDialogue || this.dialogueIndex >= this.currentDialogue.length) {
      this.closeDialog();
      return;
    }

    // Cancelar timer anterior se existir
    if (this.typeTimer) {
      this.typeTimer.remove();
      this.typeTimer = null;
    }

    const dialogue = this.currentDialogue[this.dialogueIndex];
    const text = dialogue.text || dialogue;
    
    // Guardar texto completo para skip
    this.currentFullText = text;

    this.isTyping = true;
    this.continueIndicator.setVisible(false);
    this.dialogText.setText('');

    // Efeito de digitação
    let charIndex = 0;
    const typingSpeed = 30; // ms por caractere

    this.typeTimer = this.time.addEvent({
      delay: typingSpeed,
      callback: () => {
        if (charIndex < text.length) {
          this.dialogText.setText(text.substring(0, charIndex + 1));
          charIndex++;
        } else {
          if (this.typeTimer) {
            this.typeTimer.remove();
            this.typeTimer = null;
          }
          this.isTyping = false;
          // Verificar se currentDialogue ainda existe antes de acessar
          this.continueIndicator.setVisible(
            this.currentDialogue && this.dialogueIndex < this.currentDialogue.length - 1
          );
        }
      },
      loop: true
    });
  }

  /**
   * Avança para o próximo diálogo
   */
  advanceDialogue() {
    // Se está digitando, completar o texto atual (skip da animação)
    if (this.isTyping) {
      // Cancelar timer de digitação
      if (this.typeTimer) {
        this.typeTimer.remove();
        this.typeTimer = null;
      }
      
      // Mostrar texto completo imediatamente
      this.dialogText.setText(this.currentFullText);
      this.isTyping = false;
      
      // Mostrar indicador de continuar se houver mais diálogos
      this.continueIndicator.setVisible(
        this.currentDialogue && this.dialogueIndex < this.currentDialogue.length - 1
      );
      return;
    }

    // Se não está digitando, avançar para próximo diálogo
    if (this.currentDialogue && this.dialogueIndex < this.currentDialogue.length - 1) {
      this.dialogueIndex++;
      this.displayCurrentDialogue();
    } else {
      this.closeDialog();
    }
  }

  /**
   * Fecha o diálogo
   */
  closeDialog() {
    // Cancelar timer de digitação se existir
    if (this.typeTimer) {
      this.typeTimer.remove();
      this.typeTimer = null;
    }
    
    this.dialogContainer.setVisible(false);
    this.currentDialogue = null;
    this.dialogueIndex = 0;
    this.isTyping = false;
    this.currentFullText = '';
    
    // Guardar callback antes de limpar
    const completeCallback = this.onDialogCompleteCallback;
    this.onDialogCompleteCallback = null;

    // Retomar movimentação do player - buscar cena ativa do jogo
    const activeGameScene = this.getActiveGameScene();
    if (activeGameScene?.playerController) {
      console.log('[DialogScene] Enabling player controller, current state:', activeGameScene.playerController.enabled);
      activeGameScene.playerController.enabled = true;
      console.log('[DialogScene] Player controller enabled on:', activeGameScene.scene.key, '- new state:', activeGameScene.playerController.enabled);
      
      // Garantir reativação com delay adicional
      this.time.delayedCall(100, () => {
        if (activeGameScene?.playerController) {
          activeGameScene.playerController.enabled = true;
          console.log('[DialogScene] Player controller re-enabled after delay');
        }
      });
    } else {
      console.warn('[DialogScene] Could not find active game scene or player controller on close!');
    }

    // Finalizar interação
    if (activeGameScene?.interactionManager) {
      activeGameScene.interactionManager.endInteraction();
    }
    
    // Chamar callback de conclusão se existir
    if (completeCallback) {
      completeCallback();
    }

    console.log('[DialogScene] Dialog closed');
  }

  /**
   * Busca a cena de jogo ativa (não UI)
   */
  getActiveGameScene() {
    const activeScenes = this.scene.manager.getScenes(true);
    return activeScenes.find(scene => 
      scene.scene.key !== 'UIScene' && 
      scene.scene.key !== 'DialogScene' && 
      scene.scene.key !== 'PauseMenuScene' &&
      scene.scene.key !== 'MinimapScene' &&
      scene.scene.key !== 'LoginScene' &&
      !scene.scene.key.includes('Game') // Exclui minigames
    );
  }

  // ============================================
  // MENU DE OPÇÕES
  // ============================================

  /**
   * Mostra o diálogo com menu de opções
   * @param {Object} data - Dados do menu
   * @param {string} data.name - Nome do elemento/NPC
   * @param {string} [data.greeting] - Texto de saudação
   * @param {Array} data.options - Array de opções
   * @param {Function} [data.onSelect] - Callback quando opção é selecionada
   * @param {Function} [data.onClose] - Callback quando menu é fechado
   */
  showOptionsDialog(data) {
    console.log('[DialogScene] showOptionsDialog called with data:', data);

    // Trazer DialogScene para o topo
    this.scene.bringToTop();

    // Guardar callbacks
    this.onSelectCallback = data.onSelect || null;
    this.onCloseCallback = data.onClose || null;
    this.currentOptions = data.options || [];
    this.selectedOptionIndex = 0;
    this.optionsMode = true;

    // Configurar título e greeting
    this.optionsTitle.setText(data.name || 'Interação');
    this.greetingText.setText(data.greeting || '');

    // Limpar botões anteriores
    this.clearOptionButtons();

    // Criar botões de opção
    this.createOptionButtons();

    // Mostrar container de opções
    this.optionsContainer.setVisible(true);

    // Pausar movimentação do player
    const activeGameScene = this.getActiveGameScene();
    if (activeGameScene?.playerController) {
      activeGameScene.playerController.enabled = false;
    }

    console.log('[DialogScene] Options dialog shown with', this.currentOptions.length, 'options');
  }

  /**
   * Cria os botões de opção com sistema de scroll
   */
  createOptionButtons() {
    const { width } = this.cameras.main;
    this.optionsStartY = this.greetingText.text ? 58 : 44;
    this.buttonHeight = 32;
    this.buttonSpacing = 6;
    this.visibleStartIndex = 0;

    // Calcular quantas opções cabem na área visível
    const availableHeight = this.optionsContainerHeight - this.optionsStartY - 20;
    this.maxVisibleOptions = Math.floor(availableHeight / (this.buttonHeight + this.buttonSpacing));
    this.maxVisibleOptions = Math.min(this.maxVisibleOptions, 3); // Máximo 3 opções visíveis

    // Criar todos os botões (mas apenas os visíveis serão mostrados)
    this.currentOptions.forEach((option, index) => {
      const button = this.createOptionButton(option, index, 24, 0, width - 60, this.buttonHeight);
      this.optionButtons.push(button);
      this.optionsContainer.add(button);
    });

    // Posicionar apenas os visíveis
    this.updateVisibleOptions();

    // Destacar primeira opção
    this.highlightOption(0);
  }

  /**
   * Atualiza a visibilidade e posição das opções baseado no scroll
   */
  updateVisibleOptions() {
    const endIndex = Math.min(this.visibleStartIndex + this.maxVisibleOptions, this.currentOptions.length);

    this.optionButtons.forEach((button, index) => {
      if (index >= this.visibleStartIndex && index < endIndex) {
        // Opção visível - posicionar
        const visibleIndex = index - this.visibleStartIndex;
        const y = this.optionsStartY + (visibleIndex * (this.buttonHeight + this.buttonSpacing));
        button.setY(y);
        button.setVisible(true);
      } else {
        // Opção fora da área visível
        button.setVisible(false);
      }
    });

    // Atualizar indicadores de scroll
    const hasMoreAbove = this.visibleStartIndex > 0;
    const hasMoreBelow = endIndex < this.currentOptions.length;
    
    this.scrollUpIndicator.setVisible(hasMoreAbove);
    this.scrollDownIndicator.setVisible(hasMoreBelow);
  }

  /**
   * Cria um botão de opção individual
   */
  createOptionButton(option, index, x, y, width, height) {
    const container = this.add.container(x, y);

    const isDisabled = option.disabled || false;
    const bgColor = isDisabled ? 0x333333 : 0x2a2a3e;
    const textColor = isDisabled ? '#666666' : '#ffffff';

    // Fundo do botão
    const bg = this.add.rectangle(width / 2, height / 2, width, height, bgColor)
      .setStrokeStyle(1, 0x00d9ff)
      .setInteractive({ useHandCursor: !isDisabled });

    // Ícone (se houver)
    let iconOffset = 0;
    if (option.icon) {
      const icon = this.add.text(10, height / 2, option.icon, {
        fontSize: '16px'
      }).setOrigin(0, 0.5);
      container.add(icon);
      iconOffset = 28;
    }

    // Texto do label
    const label = this.add.text(10 + iconOffset, height / 2, option.label, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: textColor
    }).setOrigin(0, 0.5);

    // Texto de descrição (se houver)
    if (option.description) {
      const desc = this.add.text(width - 8, height / 2, option.description, {
        fontSize: '11px',
        fontFamily: 'Arial',
        color: '#888888'
      }).setOrigin(1, 0.5);
      container.add(desc);
    }

    // Indicador de desabilitado
    if (isDisabled && option.disabledReason) {
      const reason = this.add.text(width - 8, height / 2, `🔒 ${option.disabledReason}`, {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#ff6666'
      }).setOrigin(1, 0.5);
      container.add(reason);
    }

    container.add([bg, label]);

    // Eventos do botão
    if (!isDisabled) {
      bg.on('pointerover', () => {
        this.selectedOptionIndex = index;
        this.highlightOption(index);
      });

      bg.on('pointerdown', () => {
        this.selectOption(option);
      });
    }

    // Guardar referência ao background para highlight
    container.bg = bg;
    container.option = option;
    container.isDisabled = isDisabled;

    return container;
  }

  /**
   * Destaca a opção selecionada e ajusta scroll se necessário
   */
  highlightOption(index) {
    // Ajustar scroll para garantir que a opção selecionada esteja visível
    if (index < this.visibleStartIndex) {
      this.visibleStartIndex = index;
      this.updateVisibleOptions();
    } else if (index >= this.visibleStartIndex + this.maxVisibleOptions) {
      this.visibleStartIndex = index - this.maxVisibleOptions + 1;
      this.updateVisibleOptions();
    }

    this.optionButtons.forEach((button, i) => {
      if (button.isDisabled) return;
      
      if (i === index) {
        button.bg.setFillStyle(0x3a3a4e);
        button.bg.setStrokeStyle(2, 0x00ffff);
      } else {
        button.bg.setFillStyle(0x2a2a3e);
        button.bg.setStrokeStyle(1, 0x00d9ff);
      }
    });
  }

  /**
   * Navega pelas opções com teclado
   */
  navigateOptions(direction) {
    if (!this.optionsMode || this.currentOptions.length === 0) return;

    // Encontrar próxima opção não desabilitada
    let newIndex = this.selectedOptionIndex;
    let attempts = 0;
    const maxAttempts = this.currentOptions.length;

    do {
      newIndex += direction;
      if (newIndex < 0) newIndex = this.currentOptions.length - 1;
      if (newIndex >= this.currentOptions.length) newIndex = 0;
      attempts++;
    } while (
      this.currentOptions[newIndex].disabled && 
      attempts < maxAttempts
    );

    if (!this.currentOptions[newIndex].disabled) {
      this.selectedOptionIndex = newIndex;
      this.highlightOption(newIndex);
    }
  }

  /**
   * Seleciona a opção atual (Enter)
   */
  selectCurrentOption() {
    if (!this.optionsMode || this.currentOptions.length === 0) return;

    const option = this.currentOptions[this.selectedOptionIndex];
    if (!option.disabled) {
      this.selectOption(option);
    }
  }

  /**
   * Processa a seleção de uma opção
   */
  selectOption(option) {
    console.log('[DialogScene] Option selected:', option.label);

    // Guardar callback antes de fechar (closeOptionsDialog limpa os callbacks)
    const selectCallback = this.onSelectCallback;

    // Fechar menu de opções (isso limpa onSelectCallback)
    this.closeOptionsDialog();

    // Chamar callback guardado
    if (selectCallback) {
      selectCallback(option);
    }
  }

  /**
   * Fecha o menu de opções
   */
  closeOptionsDialog() {
    this.optionsContainer.setVisible(false);
    this.optionsMode = false;
    this.clearOptionButtons();

    // Retomar movimentação do player
    const activeGameScene = this.getActiveGameScene();
    if (activeGameScene?.playerController) {
      activeGameScene.playerController.enabled = true;
    }

    // Chamar callback de fechamento
    if (this.onCloseCallback) {
      this.onCloseCallback();
      this.onCloseCallback = null;
    }

    this.onSelectCallback = null;
    this.currentOptions = null;

    console.log('[DialogScene] Options dialog closed');
  }

  /**
   * Limpa os botões de opção
   */
  clearOptionButtons() {
    this.optionButtons.forEach(button => button.destroy());
    this.optionButtons = [];
  }
}

