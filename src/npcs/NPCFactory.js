/**
 * NPCFactory - Criar e configurar NPCs
 */

import { NPC } from '../entities/NPC.js';
import { NPC_TEXTS } from '../i18n/npcTexts.js';
import { normalizeNpcConfig } from './npcConfig.js';

export default class NPCFactory {
  /**
   * Cria um NPC na cena
   * @param {Phaser.Scene} scene 
   * @param {number} x 
   * @param {number} y 
   * @param {Object} config - Configuração do NPC
   */
  static create(scene, x, y, config = {}) {
    const normalized = normalizeNpcConfig(config, {
      id: 'npc_' + Date.now(),
      name: NPC_TEXTS.defaults.fallbackName,
      x,
      y,
      texture: 'npc_default',
      frame: 0,
      scale: 4,
      scaleMultiplier: 1,
      depth: 4,
      dialogues: [],
      canMove: false,
      patrol: null,
      interactionRadius: 32,
      flipX: false
    });

    const id = normalized.id;
    const name = normalized.name;
    const texture = normalized.texture;
    const frame = normalized.frame;
    const scale = Number.isFinite(normalized.scale)
      ? normalized.scale
      : 4 * normalized.scaleMultiplier;
    const depth = normalized.depth;
    const dialogues = normalized.dialogues;
    const canMove = normalized.canMove;
    const patrol = normalized.patrol;
    const interactionRadius = normalized.interactionRadius;

    // Criar sprite do NPC
    const npc = scene.physics.add.sprite(x, y, texture, frame);
    npc.setScale(scale);
    npc.setDepth(depth);
    npc.setFlipX(Boolean(normalized.flipX));
    npc.setCollideWorldBounds(true);

    // Propriedades customizadas
    npc.npcId = id;
    npc.npcName = name;
    npc.dialogues = dialogues;
    npc.currentDialogueIndex = 0;
    npc.canMove = canMove;
    npc.patrol = patrol;
    npc.isInteracting = false;
    npc.role = normalized.role;
    npc.interactionAreaWidth = Number.isFinite(normalized.interactionAreaWidth) ? normalized.interactionAreaWidth : 0;
    npc.interactionAreaHeight = Number.isFinite(normalized.interactionAreaHeight) ? normalized.interactionAreaHeight : 0;

    // Criar zona de interação (círculo invisível)
    npc.interactionZone = scene.add.circle(x, y, interactionRadius, 0x00ff00, 0);
    scene.physics.add.existing(npc.interactionZone);
    npc.interactionZone.body.setCircle(interactionRadius);
    npc.interactionZone.npcRef = npc; // Referência ao NPC

    const getNameTagOffset = () => Math.max(32, Math.round((npc.displayHeight || 64) * 0.55));
    const getIndicatorOffset = () => getNameTagOffset() + 16;

    // Indicador de interação (tecla E)
    npc.interactionIndicator = scene.add.container(x, y - getIndicatorOffset());
    const indicatorBg = scene.add.circle(0, 0, 12, 0x000000, 0.7);
    const indicatorText = scene.add.text(0, 0, 'E', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    npc.interactionIndicator.add([indicatorBg, indicatorText]);
    npc.interactionIndicator.setDepth(Math.max(12, depth + 2));
    npc.interactionIndicator.setVisible(false);

    // Balão de nome
    npc.nameTag = scene.add.text(x, y - getNameTagOffset(), name, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(Math.max(11, depth + 1));

    // Atualizar posições dos elementos
    npc.updateElements = function() {
      const npcDepth = Number.isFinite(this.depth) ? this.depth : depth;
      const nameTagOffset = Math.max(32, Math.round((this.displayHeight || 64) * 0.55));
      const indicatorOffset = nameTagOffset + 16;

      this.interactionZone?.setPosition(this.x, this.y);
      this.interactionIndicator?.setPosition(this.x, this.y - indicatorOffset);
      this.interactionIndicator?.setDepth(npcDepth + 2);
      this.nameTag?.setPosition(this.x, this.y - nameTagOffset);
      this.nameTag?.setDepth(npcDepth + 1);
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
      name: NPC_TEXTS.templates.receptionist.name,
      texture: 'npc_receptionist',
      dialogues: NPC_TEXTS.templates.receptionist.dialogues,
      canMove: false
    },
    
    manager: {
      name: NPC_TEXTS.templates.manager.name,
      texture: 'npc_manager',
      dialogues: NPC_TEXTS.templates.manager.dialogues,
      canMove: true,
      patrol: { points: [[100, 100], [200, 100]], speed: 40 }
    },

    trainer: {
      name: NPC_TEXTS.templates.trainer.name,
      texture: 'npc_trainer',
      dialogues: NPC_TEXTS.templates.trainer.dialogues,
      canMove: false
    }
  };

  /**
   * Cria uma entidade NPC encapsulada (versão OOP melhorada)
   * 
   * Esta função cria o sprite usando create() e retorna uma
   * instância da classe NPC que encapsula o sprite com melhor
   * organização e funcionalidades extras.
   * 
   * @param {Phaser.Scene} scene - A cena onde o NPC será criado
   * @param {number} x - Posição X inicial
   * @param {number} y - Posição Y inicial
   * @param {Object} config - Configuração do NPC (mesma do create())
   * @returns {NPC} Instância da classe NPC wrapper
   * 
   * @example
   * const npc = NPCFactory.createEntity(scene, 100, 200, {
   *   id: 'receptionist_1',
   *   name: 'Maria',
   *   dialogues: [
   *     { text: 'Bem-vindo!', emotion: 'happy' }
   *   ]
   * });
   * 
   * // Usar métodos da entidade
   * npc.showInteractionIndicator();
   * const dialogue = npc.getNextDialogue();
   */
  static createEntity(scene, x, y, config = {}) {
    // Criar sprite usando o método existente
    const sprite = this.create(scene, x, y, config);
    
    // Criar entidade wrapper
    const npcEntity = new NPC(scene, sprite, {
      id: config.id || sprite.npcId,
      name: config.name || sprite.npcName,
      dialogues: config.dialogues || [],
      canMove: config.canMove || false,
      patrol: config.patrol || null,
      interactionRadius: config.interactionRadius || 32,
      ...config
    });
    
    console.log('[NPCFactory] Created NPC entity:', {
      id: npcEntity.getId(),
      name: npcEntity.getName(),
      position: npcEntity.getPosition()
    });
    
    return npcEntity;
  }

  /**
   * Cria múltiplas entidades NPC a partir de um array
   * @param {Phaser.Scene} scene 
   * @param {Array} npcsConfig - Array de configurações
   * @returns {NPC[]} Array de entidades NPC
   */
  static createMultipleEntities(scene, npcsConfig) {
    return npcsConfig.map(config => 
      NPCFactory.createEntity(scene, config.x, config.y, config)
    );
  }
}
