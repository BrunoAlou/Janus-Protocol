import { RECEPTION_TEXTS } from '../../../../i18n/receptionTexts.js';

/**
 * ReceptionIntroducer - Gerencia o fluxo de introdução da recepção
 * 
 * Responsabilidades:
 * - Mostrar modal de boas-vindas (com paginação)
 * - Mostrar diálogo de introdução
 * - Rastrear se foi visto anteriormente
 */
export class ReceptionIntroducer {
  /**
   * @param {ReceptionScene} scene - Cena de recepção
   */
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Orquestra o fluxo de introdução
   * Mostra modal → diálogo, apenas se não tiver visto antes
   */
  showIntroductionFlow() {
    const modalSeen = window.gameState?.getFlag?.(this.scene.modalSeenFlagKey) === true;
    const dialogSeen = window.gameState?.getFlag?.(this.scene.dialogSeenFlagKey) === true;

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
  }

  /**
   * Mostra o modal de boas-vindas com paginação
   */
  showPreWelcomeModal(onContinue) {
    if (this.scene.onboardingModalOpen) {
      return;
    }

    this.scene.onboardingModalOpen = true;
    this.scene.setFlowFlag(this.scene.modalFlowFlagKey, true);
    
    if (this.scene.playerController) {
      this.scene.playerController.enabled = false;
    }

    const camera = this.scene.cameras.main;
    const width = camera.width;
    const height = camera.height;

    // Overlay
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72)
      .setScrollFactor(0)
      .setInteractive();
    overlay.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
    });

    // Panel
    const panelWidth = Math.min(550, Math.max(320, width * 0.9));
    const panelHeight = Math.min(260, Math.max(260, height * 0.86));
    const panel = this.scene.add.rectangle(
      width / 2,
      height / 2,
      panelWidth,
      panelHeight,
      0x10172a,
      0.98
    )
      .setStrokeStyle(3, 0x00d9ff)
      .setScrollFactor(0)
      .setInteractive();
    panel.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation?.();
    });

    // Title
    const title = this.scene.add.text(
      width / 2,
      panel.y - panelHeight / 2 + 18,
      RECEPTION_TEXTS.modal.title,
      {
        fontSize: '20px',
        color: '#00d9ff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0).setScrollFactor(0);

    const pages = RECEPTION_TEXTS.modal.pages;
    let pageIndex = 0;

    // Body text
    const body = this.scene.add.text(
      panel.x - panelWidth / 2 + 24,
      title.y + 42,
      pages[0],
      {
        fontSize: '16px',
        color: '#e6f4ff',
        wordWrap: { width: panelWidth - 48 },
        lineSpacing: 5
      }
    ).setOrigin(0, 0).setScrollFactor(0);

    // Page counter
    const pageCounter = this.scene.add.text(
      panel.x,
      panel.y + panelHeight / 2 - 42,
      `1/${pages.length}`,
      {
        fontSize: '15px',
        color: '#9cc4ff'
      }
    ).setOrigin(0.5).setScrollFactor(0);

    // Previous button
    const prevButton = this.scene.add.text(
      panel.x - 92,
      panel.y + panelHeight / 2 - 42,
      RECEPTION_TEXTS.modal.previousButton,
      {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#2a3f6b',
        padding: { x: 12, y: 6 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

    // Next button
    const nextButton = this.scene.add.text(
      panel.x + 92,
      panel.y + panelHeight / 2 - 42,
      RECEPTION_TEXTS.modal.nextButton,
      {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#2a3f6b',
        padding: { x: 12, y: 6 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });

    // Continue button (appear only on last page)
    const continueButton = this.scene.add.text(
      width / 2,
      panel.y + panelHeight / 2 - 42,
      RECEPTION_TEXTS.modal.continueButton,
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#2a3f6b',
        padding: { x: 18, y: 8 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setInteractive({ useHandCursor: true });
    continueButton.setVisible(false);

    // Navigation handlers
    const updateButtonVisibility = () => {
      const isLastPage = pageIndex === pages.length - 1;
      const isFirstPage = pageIndex === 0;
      
      prevButton.setVisible(!isFirstPage);
      nextButton.setVisible(!isLastPage);
      continueButton.setVisible(isLastPage);
    };

    prevButton.on('pointerdown', () => {
      if (pageIndex > 0) {
        pageIndex--;
        body.setText(pages[pageIndex]);
        pageCounter.setText(`${pageIndex + 1}/${pages.length}`);
        updateButtonVisibility();
      }
    });

    nextButton.on('pointerdown', () => {
      if (pageIndex < pages.length - 1) {
        pageIndex++;
        body.setText(pages[pageIndex]);
        pageCounter.setText(`${pageIndex + 1}/${pages.length}`);
        updateButtonVisibility();
      }
    });

    continueButton.on('pointerdown', () => {
      // Cleanup
      overlay.destroy();
      panel.destroy();
      title.destroy();
      body.destroy();
      pageCounter.destroy();
      prevButton.destroy();
      nextButton.destroy();
      continueButton.destroy();

      this.scene.onboardingModalOpen = false;
      this.scene.setFlowFlag(this.scene.modalFlowFlagKey, false);
      this.scene.setFlowFlag(this.scene.modalSeenFlagKey, true);
      
      if (this.scene.playerController) {
        this.scene.playerController.enabled = true;
      }

      if (onContinue) {
        onContinue();
      }
    });

    updateButtonVisibility();
  }

  /**
   * Mostra o diálogo de introdução
   */
  startWelcomeDialog() {
    if (this.scene.onboardingModalOpen || this.scene.onboardingDialogOpen) {
      return;
    }

    const dialogScene = this.scene.scene.get('DialogScene');

    console.log('[ReceptionIntroducer] Trying to show intro dialogue');
    console.log('[ReceptionIntroducer] DialogScene:', dialogScene);
    console.log('[ReceptionIntroducer] DialogScene active?', this.scene.scene.isActive('DialogScene'));

    if (dialogScene && this.scene.scene.isActive('DialogScene')) {
      this.scene.onboardingDialogOpen = true;
      this.scene.setFlowFlag(this.scene.dialogFlowFlagKey, true);

      const introData = {
        name: RECEPTION_TEXTS.introDialog.name,
        dialogues: RECEPTION_TEXTS.introDialog.dialogues.map((text, index) => ({
          text,
          emotion: index === 1 ? 'determined' : 'neutral'
        })),
        onComplete: () => {
          this.scene.onboardingDialogOpen = false;
          this.scene.setFlowFlag(this.scene.dialogFlowFlagKey, false);
          this.scene.setFlowFlag(this.scene.dialogSeenFlagKey, true);
        }
      };

      dialogScene.showDialog(introData);
      console.log('[ReceptionIntroducer] Introduction dialogue started');
    } else {
      this.scene.onboardingDialogOpen = false;
      this.scene.setFlowFlag(this.scene.dialogFlowFlagKey, false);
      console.error('[ReceptionIntroducer] DialogScene not found or not active!');
    }
  }
}
