/**
 * NPCFactory - Criar e configurar NPCs
 */

export default class NPCFactory {
  /**
   * Cria um NPC na cena
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   * @param {Object} config - Configuração do NPC
   */
  static create(scene, x, y, config = {}) {
    const {
      id = 'npc_' + Date.now(),
      name = 'NPC',
      texture = 'npc_default',
      frame = 0,
      scale = 2,
      depth = 4,
      dialogues = [],
      canMove = false,
      patrol = null, // { points: [[x1,y1], [x2,y2]], speed: 50 }
      interactionRadius = 32
    } = config;

    // Criar sprite do NPC
    const npc = scene.physics.add.sprite(x, y, texture, frame);
    npc.setScale(scale);
    npc.setDepth(depth);
    npc.setCollideWorldBounds(true);

    // Propriedades customizadas
    npc.npcId = id;
    npc.npcName = name;
    npc.dialogues = dialogues;
    npc.currentDialogueIndex = 0;
    npc.canMove = canMove;
    npc.patrol = patrol;
    npc.isInteracting = false;

    // Criar zona de interação (círculo invisível)
    npc.interactionZone = scene.add.circle(x, y, interactionRadius, 0x00ff00, 0);
    scene.physics.add.existing(npc.interactionZone);
    npc.interactionZone.body.setCircle(interactionRadius);
    npc.interactionZone.npcRef = npc; // Referência ao NPC

    // Indicador de interação (tecla E)
    npc.interactionIndicator = scene.add.container(x, y - 50);
    const indicatorBg = scene.add.circle(0, 0, 12, 0x000000, 0.7);
    const indicatorText = scene.add.text(0, 0, 'E', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    npc.interactionIndicator.add([indicatorBg, indicatorText]);
    npc.interactionIndicator.setDepth(10);
    npc.interactionIndicator.setVisible(false);

    // Balão de nome
    npc.nameTag = scene.add.text(x, y - 35, name, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(10);

    // Atualizar posições dos elementos
    npc.updateElements = function() {
      this.interactionZone.setPosition(this.x, this.y);
      this.interactionIndicator.setPosition(this.x, this.y - 50);
      this.nameTag.setPosition(this.x, this.y - 35);
    };

    // Limpar elementos ao destruir
    const originalDestroy = npc.destroy.bind(npc);
    npc.destroy = function() {
      this.interactionZone?.destroy();
      this.interactionIndicator?.destroy();
      this.nameTag?.destroy();
      originalDestroy();
    };

    console.log('[NPCFactory] Created NPC:', { id, name, x, y });
    return npc;
  }

  /**
   * Cria múltiplos NPCs a partir de um array
   */
  static createMultiple(scene, npcsConfig) {
    return npcsConfig.map(config => 
      NPCFactory.create(scene, config.x, config.y, config)
    );
  }

  /**
   * Template de NPCs pré-configurados
   */
  static templates = {
    receptionist: {
      name: 'Recepcionista',
      texture: 'npc_receptionist',
      dialogues: [
        { text: 'Bem-vindo ao Janus Protocol!', emotion: 'happy' },
        { text: 'Como posso ajudá-lo hoje?', emotion: 'neutral' }
      ],
      canMove: false
    },
    
    manager: {
      name: 'Gerente',
      texture: 'npc_manager',
      dialogues: [
        { text: 'Olá! Precisa de alguma orientação?', emotion: 'professional' },
        { text: 'Estou aqui para ajudar no seu treinamento.', emotion: 'happy' }
      ],
      canMove: true,
      patrol: { points: [[100, 100], [200, 100]], speed: 40 }
    },

    trainer: {
      name: 'Instrutor',
      texture: 'npc_trainer',
      dialogues: [
        { text: 'Pronto para um desafio?', emotion: 'excited' },
        { text: 'Vamos testar suas habilidades!', emotion: 'neutral' }
      ],
      canMove: false
    }
  };
}
