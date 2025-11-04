import Phaser from 'phaser';

/**
 * DialogScene - Hub de conversas na parte inferior
 */
export default class DialogScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DialogScene', active: false });
    this.currentDialogue = null;
    this.dialogueIndex = 0;
    this.isTyping = false;
  }

  create() {
    const { width, height } = this.cameras.main;

    // Container principal do diálogo
    this.dialogContainer = this.add.container(0, height - 200);
    this.dialogContainer.setDepth(1000);
    this.dialogContainer.setVisible(false);

    // Fundo do diálogo (painel inferior)
    const dialogBg = this.add.rectangle(
      width / 2,
      100,
      width - 40,
      180,
      0x000000,
      0.85
    );
    dialogBg.setStrokeStyle(2, 0x00d9ff);

    // Nome do NPC
    this.npcNameText = this.add.text(30, 20, '', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#00d9ff',
      fontStyle: 'bold'
    });

    // Texto do diálogo
    this.dialogText = this.add.text(30, 55, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: width - 100 }
    });

    // Indicador de continuação
    this.continueIndicator = this.add.text(
      width - 70,
      160,
      '▼ ESPAÇO',
      {
        fontSize: '14px',
        color: '#ffff00'
      }
    );
    this.continueIndicator.setVisible(false);

    // Botão fechar (X)
    const closeButton = this.add.text(width - 60, 20, '✕', {
      fontSize: '24px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    
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

    // Tecla ESPAÇO para avançar diálogo
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.spaceKey.on('down', () => this.advanceDialogue());

    // Escutar eventos de interação
    this.game.scene.getScene('ReceptionScene')?.events.on('npc-interact', (data) => {
      this.showDialog(data);
    });

    console.log('[DialogScene] Created');
  }

  /**
   * Mostra diálogo do NPC
   */
  showDialog(data) {
    this.currentDialogue = data.dialogues;
    this.dialogueIndex = 0;
    this.npcNameText.setText(data.name);
    
    this.dialogContainer.setVisible(true);
    this.displayCurrentDialogue();

    // Pausar movimentação do player
    const mainScene = this.game.scene.getScene('ReceptionScene');
    if (mainScene?.playerController) {
      mainScene.playerController.enabled = false;
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

    const dialogue = this.currentDialogue[this.dialogueIndex];
    const text = dialogue.text || dialogue;

    this.isTyping = true;
    this.continueIndicator.setVisible(false);
    this.dialogText.setText('');

    // Efeito de digitação
    let charIndex = 0;
    const typingSpeed = 30; // ms por caractere

    const typeTimer = this.time.addEvent({
      delay: typingSpeed,
      callback: () => {
        if (charIndex < text.length) {
          this.dialogText.setText(this.dialogText.text + text[charIndex]);
          charIndex++;
        } else {
          typeTimer.remove();
          this.isTyping = false;
          this.continueIndicator.setVisible(this.dialogueIndex < this.currentDialogue.length - 1);
        }
      },
      loop: true
    });
  }

  /**
   * Avança para o próximo diálogo
   */
  advanceDialogue() {
    if (this.isTyping) {
      // Pular animação de digitação
      const dialogue = this.currentDialogue[this.dialogueIndex];
      const text = dialogue.text || dialogue;
      this.dialogText.setText(text);
      this.isTyping = false;
      this.continueIndicator.setVisible(this.dialogueIndex < this.currentDialogue.length - 1);
      return;
    }

    if (this.dialogueIndex < this.currentDialogue.length - 1) {
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
    this.dialogContainer.setVisible(false);
    this.currentDialogue = null;
    this.dialogueIndex = 0;
    this.isTyping = false;

    // Retomar movimentação do player
    const mainScene = this.game.scene.getScene('ReceptionScene');
    if (mainScene?.playerController) {
      mainScene.playerController.enabled = true;
    }

    // Finalizar interação
    if (mainScene?.interactionManager) {
      mainScene.interactionManager.endInteraction();
    }

    console.log('[DialogScene] Dialog closed');
  }
}
