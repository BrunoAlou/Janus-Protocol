import BaseMapScene from './BaseMapScene.js';

/**
 * HallwayScene - Corredor
 */
export default class HallwayScene extends BaseMapScene {
  constructor() {
    super('HallwayScene', 'hallway');
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 240;
  }

  setupNPCs() {
    // Corredor sem NPCs (área de passagem)
    this.npcs = [];
  }
}
