import Phaser from 'phaser';

/**
 * MinimapScene - Minimapa exibido no canto da tela
 */
export default class MinimapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MinimapScene', active: false }); // Será lançada pelas cenas de mapa
    this.currentRoom = 'ReceptionScene';
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Container do minimapa (canto superior direito)
    this.minimapContainer = this.add.container(width - 170, 70).setDepth(900);
    
    // Fundo do minimapa
    const bg = this.add.rectangle(0, 0, 160, 180, 0x000000, 0.7)
      .setStrokeStyle(2, 0x00d9ff);
    
    // Título
    const title = this.add.text(0, -75, 'MAPA', {
      fontSize: '14px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Grade de salas (3x3)
    this.rooms = {
      'BossRoomScene': { x: -45, y: -45, name: 'Chefe' },
      'MeetingRoomScene': { x: 0, y: -45, name: 'Reunião' },
      'RhRoomScene': { x: 45, y: -45, name: 'RH' },
      
      'OfficeScene': { x: -45, y: 0, name: 'Escrit.' },
      'ElevatorScene': { x: 0, y: 0, name: 'Elevad.' },
      'ItRoomScene': { x: 45, y: 0, name: 'TI' },
      
      'GardenScene': { x: -45, y: 45, name: 'Jardim' },
      'ReceptionScene': { x: 0, y: 45, name: 'Recep.' },
      'GameScene': { x: 0, y: 45, name: 'Recep.' }, // GameScene é a recepção atual
      'LabScene': { x: 45, y: 45, name: 'Lab' }
    };
    
    // Criar células do minimapa
    this.roomCells = {};
    Object.keys(this.rooms).forEach(roomKey => {
      const room = this.rooms[roomKey];
      
      const cell = this.add.rectangle(room.x, room.y, 35, 35, 0x2a2a3e)
        .setStrokeStyle(1, 0x666666);
      
      const label = this.add.text(room.x, room.y, room.name, {
        fontSize: '8px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      this.roomCells[roomKey] = { cell, label };
    });
    
    // Adicionar todos ao container
    this.minimapContainer.add(bg);
    this.minimapContainer.add(title);
    Object.values(this.roomCells).forEach(({ cell, label }) => {
      this.minimapContainer.add(cell);
      this.minimapContainer.add(label);
    });
    
    // Indicador de posição atual (player)
    this.playerIndicator = this.add.circle(0, 0, 4, 0xff0000)
      .setStrokeStyle(1, 0xffffff);
    this.minimapContainer.add(this.playerIndicator);
    
    // Atualizar posição inicial
    this.updateCurrentRoom('ReceptionScene');
    
    // Escutar mudanças de sala
    this.game.events.on('room-changed', (roomKey) => {
      this.updateCurrentRoom(roomKey);
    });
    
    // Escutar eventos de resize
    this.scale.on('resize', this.resize, this);
    
    console.log('[MinimapScene] Created');
  }

  /**
   * Atualiza a sala atual no minimapa
   */
  updateCurrentRoom(roomKey) {
    if (this.currentRoom === roomKey) return;
    
    // Desmarcar sala anterior
    if (this.currentRoom && this.roomCells[this.currentRoom]) {
      this.roomCells[this.currentRoom].cell.setFillStyle(0x2a2a3e);
    }
    
    // Marcar nova sala
    if (this.roomCells[roomKey]) {
      this.roomCells[roomKey].cell.setFillStyle(0x00d9ff);
      
      // Mover indicador do player
      const room = this.rooms[roomKey];
      this.playerIndicator.setPosition(room.x, room.y);
      
      this.currentRoom = roomKey;
      console.log('[MinimapScene] Room changed to:', roomKey);
    }
  }

  /**
   * Ajusta posição quando a tela redimensiona
   */
  resize(width, height) {
    if (this.minimapContainer) {
      this.minimapContainer.setPosition(width - 170, 70);
    }
  }
}
