import BaseMapScene from './BaseMapScene.js';

/**
 * ElevatorScene - Elevador (transição entre andares)
 */
export default class ElevatorScene extends BaseMapScene {
  constructor() {
    super('ElevatorScene', 'elevator');
  }

  create() {
    super.create();
    
    // Menu de seleção de andar
    this.createFloorMenu();
  }

  getSpawnX() {
    return 320;
  }

  getSpawnY() {
    return 300;
  }

  setupNPCs() {
    // Elevador sem NPCs
    this.npcs = [];
  }

  createFloorMenu() {
    const { width, height } = this.cameras.main;
    
    // Painel de seleção de andares
    const menuContainer = this.add.container(width / 2, height / 2).setDepth(100);
    
    const bg = this.add.rectangle(0, 0, 300, 400, 0x1a1a2e, 0.95)
      .setStrokeStyle(2, 0x00d9ff);
    
    const title = this.add.text(0, -170, 'SELECIONE O ANDAR', {
      fontSize: '20px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Botões de andares
    const floors = [
      { name: 'Recepção', scene: 'ReceptionScene' },
      { name: 'Escritório', scene: 'OfficeScene' },
      { name: 'RH', scene: 'RhRoomScene' },
      { name: 'TI', scene: 'ItRoomScene' },
      { name: 'Laboratório', scene: 'LabScene' },
      { name: 'Jardim', scene: 'GardenScene' },
      { name: 'Sala do Chefe', scene: 'BossRoomScene' }
    ];
    
    floors.forEach((floor, index) => {
      const btn = this.add.text(0, -120 + index * 50, floor.name, {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#2a2a3e',
        padding: { x: 20, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      btn.on('pointerover', () => btn.setBackgroundColor('#3a3a4e'));
      btn.on('pointerout', () => btn.setBackgroundColor('#2a2a3e'));
      btn.on('pointerdown', () => this.goToFloor(floor.scene));
      
      menuContainer.add(btn);
    });
    
    menuContainer.add([bg, title]);
  }

  goToFloor(sceneKey) {
    console.log('[ElevatorScene] Going to:', sceneKey);
    this.transitionTo(sceneKey);
  }
}
