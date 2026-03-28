import { ELEVATOR_TEXTS } from '../../../../i18n/elevatorTexts.js';

export class ElevatorIntroducer {
  constructor(scene) {
    this.scene = scene;
  }

  showIntroductionFlow(onComplete) {
    const modalSeen = window.gameState?.getFlag?.(this.scene.elevatorModalSeenFlagKey) === true;
    const dialogSeen = window.gameState?.getFlag?.(this.scene.elevatorDialogSeenFlagKey) === true;

    if (!modalSeen) {
      this.showQuantumModal(() => {
        if (!dialogSeen) {
          this.startIntroDialog(onComplete);
          return;
        }

        if (typeof onComplete === 'function') {
          onComplete();
        }
      });
      return;
    }

    if (!dialogSeen) {
      this.startIntroDialog(onComplete);
      return;
    }

    if (typeof onComplete === 'function') {
      onComplete();
    }
  }

  showQuantumModal(onContinue) {
    if (this.scene.onboardingModalOpen) {
      return;
    }

    this.scene.onboardingModalOpen = true;
    this.scene.setElevatorFlag(this.scene.elevatorModalFlowFlagKey, true);

    const modalDepth = 5000;
    const camera = this.scene.cameras.main;
    const width = camera.width;
    const height = camera.height;
    const modalTexts = ELEVATOR_TEXTS.intro.modal;
    const pages = modalTexts.pages;
    let pageIndex = 0;

    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.74)
      .setScrollFactor(0)
      .setDepth(modalDepth)
      .setInteractive();
    overlay.on('pointerdown', (pointer, localX, localY, event) => event?.stopPropagation?.());

    const panelWidth = Math.min(620, Math.max(320, width * 0.9));
    const panelHeight = Math.min(300, Math.max(260, height * 0.82));
    const panel = this.scene.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x0b1020, 0.98)
      .setStrokeStyle(3, 0x00ff9f)
      .setScrollFactor(0)
      .setDepth(modalDepth + 1)
      .setInteractive();
    panel.on('pointerdown', (pointer, localX, localY, event) => event?.stopPropagation?.());

    const title = this.scene.add.text(
      width / 2,
      panel.y - panelHeight / 2 + 18,
      modalTexts.title,
      {
        fontSize: '20px',
        color: '#00ff9f',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5, 0).setScrollFactor(0).setDepth(modalDepth + 2);

    const body = this.scene.add.text(
      panel.x - panelWidth / 2 + 24,
      title.y + 44,
      pages[0],
      {
        fontSize: '16px',
        color: '#dffaf0',
        wordWrap: { width: panelWidth - 48 },
        lineSpacing: 6
      }
    ).setOrigin(0, 0).setScrollFactor(0).setDepth(modalDepth + 2);

    const pageCounter = this.scene.add.text(
      panel.x,
      panel.y + panelHeight / 2 - 44,
      `1/${pages.length}`,
      {
        fontSize: '15px',
        color: '#9de6cb'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(modalDepth + 2);

    const prevButton = this.scene.add.text(
      panel.x - 108,
      panel.y + panelHeight / 2 - 44,
      modalTexts.previousButton,
      {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#245246',
        padding: { x: 12, y: 6 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(modalDepth + 3).setInteractive({ useHandCursor: true });

    const nextButton = this.scene.add.text(
      panel.x + 108,
      panel.y + panelHeight / 2 - 44,
      modalTexts.nextButton,
      {
        fontSize: '22px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#245246',
        padding: { x: 12, y: 6 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(modalDepth + 3).setInteractive({ useHandCursor: true });

    const continueButton = this.scene.add.text(
      panel.x,
      panel.y + panelHeight / 2 - 44,
      modalTexts.continueButton,
      {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#245246',
        padding: { x: 16, y: 8 }
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(modalDepth + 3).setInteractive({ useHandCursor: true });
    continueButton.setVisible(false);

    const updateButtons = () => {
      const isFirst = pageIndex === 0;
      const isLast = pageIndex === pages.length - 1;
      prevButton.setVisible(!isFirst);
      nextButton.setVisible(!isLast);
      continueButton.setVisible(isLast);
    };

    const closeModal = () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      body.destroy();
      pageCounter.destroy();
      prevButton.destroy();
      nextButton.destroy();
      continueButton.destroy();

      this.scene.input.keyboard?.off('keydown-LEFT', onPrevKey);
      this.scene.input.keyboard?.off('keydown-RIGHT', onNextKey);
      this.scene.input.keyboard?.off('keydown-ENTER', onAdvanceKey);
      this.scene.input.keyboard?.off('keydown-SPACE', onAdvanceKey);

      this.scene.onboardingModalOpen = false;
      this.scene.setElevatorFlag(this.scene.elevatorModalFlowFlagKey, false);
      this.scene.setElevatorFlag(this.scene.elevatorModalSeenFlagKey, true);

      if (typeof onContinue === 'function') {
        onContinue();
      }
    };

    prevButton.on('pointerdown', () => {
      if (pageIndex <= 0) return;
      pageIndex -= 1;
      body.setText(pages[pageIndex]);
      pageCounter.setText(`${pageIndex + 1}/${pages.length}`);
      updateButtons();
    });

    nextButton.on('pointerdown', () => {
      if (pageIndex >= pages.length - 1) return;
      pageIndex += 1;
      body.setText(pages[pageIndex]);
      pageCounter.setText(`${pageIndex + 1}/${pages.length}`);
      updateButtons();
    });

    continueButton.on('pointerdown', closeModal);

    const onPrevKey = () => prevButton.emit('pointerdown');
    const onNextKey = () => nextButton.emit('pointerdown');
    const onAdvanceKey = () => {
      if (pageIndex === pages.length - 1) {
        continueButton.emit('pointerdown');
      } else {
        nextButton.emit('pointerdown');
      }
    };

    this.scene.input.keyboard?.on('keydown-LEFT', onPrevKey);
    this.scene.input.keyboard?.on('keydown-RIGHT', onNextKey);
    this.scene.input.keyboard?.on('keydown-ENTER', onAdvanceKey);
    this.scene.input.keyboard?.on('keydown-SPACE', onAdvanceKey);

    updateButtons();
  }

  startIntroDialog(onComplete) {
    if (this.scene.onboardingDialogOpen) {
      return;
    }

    this.scene.onboardingDialogOpen = true;
    this.scene.setElevatorFlag(this.scene.elevatorDialogFlowFlagKey, true);

    const runDialog = () => {
      const dialogData = ELEVATOR_TEXTS.intro.dialog;
      const dialogOk = this.scene.dialogueFlow?.showDialog(this.scene.dialogSceneKey, {
        name: dialogData.name,
        dialogues: dialogData.dialogues.map((text) => ({ text })),
        onComplete: () => {
          this.scene.onboardingDialogOpen = false;
          this.scene.setElevatorFlag(this.scene.elevatorDialogFlowFlagKey, false);
          this.scene.setElevatorFlag(this.scene.elevatorDialogSeenFlagKey, true);
          this.scene.setElevatorFlag(this.scene.elevatorQuantumIntroCompletedFlagKey, true);
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }
      });

      if (!dialogOk) {
        this.scene.time.delayedCall(100, runDialog);
      }
    };

    this.scene.dialogueFlow?.ensureDialogScene(this.scene.dialogSceneKey, 8, 0, runDialog);
  }
}