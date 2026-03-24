export function startTyping(scene, text) {
  if (scene.typeTimer) {
    scene.typeTimer.remove();
    scene.typeTimer = null;
  }

  scene.currentFullText = text;
  scene.isTyping = true;
  scene.continueIndicator.setVisible(false);
  scene.dialogText.setText('');

  let charIndex = 0;
  const typingSpeed = 30;

  scene.typeTimer = scene.time.addEvent({
    delay: typingSpeed,
    callback: () => {
      if (charIndex < text.length) {
        scene.dialogText.setText(text.substring(0, charIndex + 1));
        charIndex += 1;
        return;
      }

      if (scene.typeTimer) {
        scene.typeTimer.remove();
        scene.typeTimer = null;
      }

      scene.isTyping = false;
      scene.continueIndicator.setVisible(
        scene.currentDialogue && scene.dialogueIndex < scene.currentDialogue.length - 1
      );
    },
    loop: true
  });
}

export function skipTyping(scene) {
  if (!scene.isTyping) {
    return false;
  }

  if (scene.typeTimer) {
    scene.typeTimer.remove();
    scene.typeTimer = null;
  }

  scene.dialogText.setText(scene.currentFullText);
  scene.isTyping = false;
  scene.continueIndicator.setVisible(
    scene.currentDialogue && scene.dialogueIndex < scene.currentDialogue.length - 1
  );

  return true;
}
