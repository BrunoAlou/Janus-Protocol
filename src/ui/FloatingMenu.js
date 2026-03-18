/**
 * FloatingMenu - Menu contextual flutuante que aparece no mouse
 * Exibe opções de interação com elementos do mapa via click direito
 */

export default class FloatingMenu {
  constructor(scene, options = []) {
    this.scene = scene;
    this.options = options;
    this.container = null;
    this.isVisible = false;

    // Configuração visual
    this.config = {
      backgroundColor: '#1a1a1a',
      borderColor: '#4a9eff',
      borderWidth: 2,
      padding: { x: 8, y: 6 },
      itemHeight: 32,
      itemPadding: { x: 12, y: 6 },
      fontSize: '14px',
      fontFamily: 'Arial',
      textColor: '#ffffff',
      hoverColor: '#2a4a6a',
      separatorColor: '#333333',
      maxWidth: 250,
      cornerRadius: 4
    };

    // Rastrear item hovereado
    this.hoveredItem = null;
    this.items = [];

    // Fechar menu ao clicar em outro lugar
    this.closeHandler = () => this.hide();
  }

  /**
   * Exibe o menu na posição do mouse
   * @param {number} x - Posição X
   * @param {number} y - Posição Y
   * @param {Object[]} options - Array de opções { label, icon, action, disabled }
   */
  show(x, y, options = []) {
    if (options.length > 0) {
      this.options = options;
    }

    if (this.options.length === 0) {
      console.warn('[FloatingMenu] No options to display');
      return;
    }

    this._createMenuGraphics(x, y);
    this.isVisible = true;

    // Adicionar listener para fechar ao clicar em outro lugar
    this.scene.input.on('pointerdown', this.closeHandler);
  }

  /**
   * Cria os elementos gráficos do menu
   * @private
   */
  _createMenuGraphics(x, y) {
    // Remover menu antigo
    if (this.container) {
      this.container.destroy();
    }

    this.container = this.scene.add.container(0, 0);
    this.items = [];

    const cfg = this.config;
    const totalHeight = (this.options.length * cfg.itemHeight) + (cfg.padding.y * 2);
    const totalWidth = cfg.maxWidth;

    // Background
    const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(cfg.backgroundColor).color, 0.95);
    graphics.lineStyle(cfg.borderWidth, Phaser.Display.Color.HexStringToColor(cfg.borderColor).color);
    graphics.fillRoundedRect(0, 0, totalWidth, totalHeight, cfg.cornerRadius);
    graphics.strokeRoundedRect(0, 0, totalWidth, totalHeight, cfg.cornerRadius);
    this.container.add(graphics);

    // Itens do menu
    let yOffset = cfg.padding.y;
    this.options.forEach((option, index) => {
      const itemGroup = this._createMenuItem(
        option,
        index,
        cfg.padding.x,
        yOffset,
        totalWidth - (cfg.padding.x * 2)
      );
      this.container.add(itemGroup);
      this.items.push({
        group: itemGroup,
        option: option,
        y: yOffset,
        height: cfg.itemHeight
      });
      yOffset += cfg.itemHeight;
    });

    // Posicionar menu com limite de tela
    let finalX = x + 10;
    let finalY = y + 10;

    // Ajustar X se sair da tela
    if (finalX + totalWidth > this.scene.cameras.main.width) {
      finalX = this.scene.cameras.main.width - totalWidth - 10;
    }

    // Ajustar Y se sair da tela
    if (finalY + totalHeight > this.scene.cameras.main.height) {
      finalY = this.scene.cameras.main.height - totalHeight - 10;
    }

    this.container.setPosition(finalX, finalY);
    this.container.setDepth(1000); // Ficar acima de tudo
  }

  /**
   * Cria um item do menu
   * @private
   */
  _createMenuItem(option, index, x, y, width) {
    const itemGroup = this.scene.add.container(x, y);
    const cfg = this.config;

    // Fundo do item (interativo)
    const itemBg = this.scene.make.graphics({ x: 0, y: 0, add: false });
    itemBg.fillStyle(0x000000, 0);
    itemBg.fillRect(0, 0, width, cfg.itemHeight);
    itemGroup.add(itemBg);

    // Ícone (se houver)
    let textX = cfg.itemPadding.x;
    if (option.icon) {
      const iconText = this.scene.add.text(
        cfg.itemPadding.x,
        cfg.itemPadding.y + 4,
        option.icon,
        {
          fontSize: '16px',
          fontFamily: cfg.fontFamily,
          color: option.disabled ? '#666666' : cfg.textColor
        }
      );
      itemGroup.add(iconText);
      textX += 24;
    }

    // Texto do item
    const textColor = option.disabled ? '#666666' : cfg.textColor;
    const text = this.scene.add.text(
      textX,
      cfg.itemPadding.y,
      option.label,
      {
        fontSize: cfg.fontSize,
        fontFamily: cfg.fontFamily,
        color: textColor,
        wordWrap: { width: width - textX - cfg.itemPadding.x }
      }
    );
    itemGroup.add(text);

    // Hover effect
    if (!option.disabled) {
      itemBg.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, cfg.itemHeight),
        Phaser.Geom.Rectangle.Contains
      );

      itemBg.on('pointerover', () => {
        itemBg.fillStyle(Phaser.Display.Color.HexStringToColor(cfg.hoverColor).color, 0.8);
        itemBg.fillRect(0, 0, width, cfg.itemHeight);
        this.hoveredItem = index;
      });

      itemBg.on('pointerout', () => {
        itemBg.fillStyle(0x000000, 0);
        itemBg.fillRect(0, 0, width, cfg.itemHeight);
        this.hoveredItem = null;
      });

      // Click
      itemBg.on('pointerdown', (pointer) => {
        pointer.event.stopPropagation?.();
        if (option.action && typeof option.action === 'function') {
          option.action();
        }
        this.hide();
      });
    }

    return itemGroup;
  }

  /**
   * Esconde o menu
   */
  hide() {
    if (!this.isVisible) return;

    if (this.container) {
      this.container.destroy();
      this.container = null;
    }

    this.isVisible = false;
    this.hoveredItem = null;
    this.items = [];

    // Remover listeners
    this.scene.input.off('pointerdown', this.closeHandler);
  }

  /**
   * Destrói o menu completamente
   */
  destroy() {
    this.hide();
    this.options = [];
    this.items = [];
  }
}
