/**
 * InteractionManager - Gerencia interações com NPCs e objetos
 */

export default class InteractionManager {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.nearbyNPCs = new Set();
    this.currentInteractable = null;
    
    // Tecla E para interação
    this.interactKey = scene.input.keyboard.addKey('E');
    this.interactKey.on('down', () => this.handleInteraction());

    console.log('[InteractionManager] Initialized');
  }

  /**
   * Registra NPCs para interação
   */
  registerNPCs(npcs) {
    if (!Array.isArray(npcs)) npcs = [npcs];

    npcs.forEach(npc => {
      if (!npc.interactionZone) {
        console.warn('[InteractionManager] NPC without interaction zone:', npc);
        return;
      }

      // Overlap entre player e zona de interação
      this.scene.physics.add.overlap(
        this.player,
        npc.interactionZone,
        () => this.onPlayerEnterNPCZone(npc),
        null,
        this
      );
    });

    console.log('[InteractionManager] Registered', npcs.length, 'NPCs');
  }

  /**
   * Quando player entra na zona de interação
   */
  onPlayerEnterNPCZone(npc) {
    if (!this.nearbyNPCs.has(npc)) {
      this.nearbyNPCs.add(npc);
      npc.interactionIndicator?.setVisible(true);
      console.log('[InteractionManager] Player near NPC:', npc.npcName);
    }
    this.currentInteractable = npc;
  }

  /**
   * Quando player sai da zona de interação
   */
  onPlayerExitNPCZone(npc) {
    if (this.nearbyNPCs.has(npc)) {
      this.nearbyNPCs.delete(npc);
      npc.interactionIndicator?.setVisible(false);
      console.log('[InteractionManager] Player left NPC:', npc.npcName);
    }
    if (this.currentInteractable === npc) {
      this.currentInteractable = null;
    }
  }

  /**
   * Processa interação quando tecla E é pressionada
   */
  handleInteraction() {
    if (!this.currentInteractable) {
      console.log('[InteractionManager] No interactable nearby');
      return;
    }

    const npc = this.currentInteractable;
    
    if (npc.isInteracting) {
      console.log('[InteractionManager] NPC already interacting');
      return;
    }

    console.log('[InteractionManager] Interacting with:', npc.npcName);
    
    // Emitir evento de interação
    this.scene.events.emit('npc-interact', {
      npc: npc,
      dialogues: npc.dialogues,
      name: npc.npcName
    });

    npc.isInteracting = true;
  }

  /**
   * Finaliza interação atual
   */
  endInteraction() {
    if (this.currentInteractable) {
      this.currentInteractable.isInteracting = false;
      console.log('[InteractionManager] Interaction ended');
    }
  }

  /**
   * Atualiza distâncias (chamar no update)
   */
  update() {
    // Verificar distância de todos os NPCs próximos
    const toRemove = [];
    
    this.nearbyNPCs.forEach(npc => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y
      );

      // Se ficou longe, remover
      if (distance > npc.interactionZone.body.radius + 10) {
        toRemove.push(npc);
      }
    });

    toRemove.forEach(npc => this.onPlayerExitNPCZone(npc));
  }

  /**
   * Limpar recursos
   */
  destroy() {
    this.interactKey?.destroy();
    this.nearbyNPCs.clear();
    this.currentInteractable = null;
  }
}
