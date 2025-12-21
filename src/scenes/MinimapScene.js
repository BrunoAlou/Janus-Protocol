import Phaser from 'phaser';

/**
 * MinimapScene - Minimapa exibido no canto da tela
 * Estrutura similar à UIScene para garantir funcionamento consistente
 */
export default class MinimapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MinimapScene', active: false }); // Será gerenciada pelo SceneManager
    this.currentRoom = 'ReceptionScene';
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Configurar câmera para ser estática (igual UIScene)
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.ignore = [];

    console.log('[MinimapScene] Creating minimap with dimensions:', width, 'x', height);
    
    // Posição base do minimapa (canto superior direito)
    const baseX = width - 90;
    const baseY = 70;
    
    // Fundo do minimapa (elemento direto, não container)
    this.minimapBg = this.add.rectangle(baseX, baseY, 160, 180, 0x000000, 0.7)
      .setStrokeStyle(2, 0x00d9ff)
      .setDepth(20000);
    
    console.log('[MinimapScene] Background created at:', baseX, baseY);
    
    // Título
    this.minimapTitle = this.add.text(baseX, baseY - 75, 'MAPA', {
      fontSize: '14px',
      color: '#00d9ff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20001);
    
    // Grade de salas (3x3)
    this.rooms = {
      'BossRoomScene': { x: -45, y: -45, name: 'Chefe' },
      'RoofTopScene': { x: 0, y: -45, name: 'Terraço' },
      'MeetingRoomScene': { x: 45, y: -45, name: 'Café' },
      
      'ElevatorScene': { x: 0, y: 0, name: 'Elevad.' },
      
      'iTRoomScene': { x: -45, y: 45, name: 'TI' },
      'ReceptionScene': { x: 0, y: 45, name: 'Recep.' },
      'ArchiveRoomScene': { x: 45, y: 45, name: 'Arquivo' }
    };
    
    // Criar células do minimapa (elementos diretos)
    this.roomCells = {};
    Object.keys(this.rooms).forEach(roomKey => {
      const room = this.rooms[roomKey];
      
      const cell = this.add.rectangle(baseX + room.x, baseY + room.y, 35, 35, 0x2a2a3e)
        .setStrokeStyle(1, 0x666666)
        .setDepth(20002);
      
      const label = this.add.text(baseX + room.x, baseY + room.y, room.name, {
        fontSize: '8px',
        color: '#ffffff'
      }).setOrigin(0.5).setDepth(20003);
      
      this.roomCells[roomKey] = { cell, label };
    });
    
    // Indicador de posição atual (player)
    this.playerIndicator = this.add.circle(baseX, baseY, 4, 0xff0000)
      .setStrokeStyle(1, 0xffffff)
      .setDepth(20004);
    
    // Guardar posição base para resize
    this.baseX = baseX;
    this.baseY = baseY;
    
    // Inicializar currentRoom como null para forçar atualização
    this.currentRoom = null;
    
    // Atualizar posição inicial para ReceptionScene
    this.updateCurrentRoom('ReceptionScene');
    
    console.log('[MinimapScene] Initialized with ReceptionScene at', this.rooms['ReceptionScene']);
    
    // Escutar mudanças de sala
    this.game.events.on('room-changed', (roomKey) => {
      this.updateCurrentRoom(roomKey);
    });
    
    // Escutar eventos de resize
    this.scale.on('resize', this.resize, this);
    
    // Garantir que a cena está visível
    this.scene.setVisible(true);
    
    console.log('[MinimapScene] Created and visible');
    
    // Debug: verificar estado da cena
    console.log('[MinimapScene] Scene state:', {
      active: this.scene.isActive('MinimapScene'),
      visible: this.scene.isVisible('MinimapScene'),
      bgVisible: this.minimapBg?.visible,
      depth: this.minimapBg?.depth
    });
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
      this.minimapContainer.setPosition(width - 90, 70);
    }
  }
  
  update() {
    // Forçar renderização contínua
    if (this.minimapContainer) {
      this.minimapContainer.setVisible(true);
    }
    
    // Debug ocasional (a cada segundo)
    if (this.game.loop.frame % 60 === 0) {
      console.log('[MinimapScene UPDATE] Active:', this.scene.isActive('MinimapScene'),
                  'Visible:', this.scene.isVisible('MinimapScene'),
                  'Container:', this.minimapContainer?.visible);
    }
  }
}
