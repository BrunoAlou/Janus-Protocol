import Phaser from "phaser";

// PADRONIZAÇÃO: O nome da classe é "UIScene" (UI maiúsculo).
// O nome do ficheiro também deve ser "UIScene.js".
export default class UIScene extends Phaser.Scene {
  constructor() {
    console.log("UIScene CONSTRUCTOR: A classe UIScene foi instanciada.");
    // A chave aqui também deve corresponder.
    super({ key: "UIScene" });
  }

  // Adicionando o método preload para depuração
  preload() {
    console.log("UIScene PRELOAD: A cena está a pré-carregar assets (se houver).");
  }

  create() {
    console.log("UIScene CREATE: O método create() foi chamado. A cena deve ser construída agora.");

    // Verifica se a cena está visível
    this.events.on('visible', () => {
        console.log("UIScene EVENTO: A cena tornou-se VISÍVEL.");
    });
    this.events.on('shutdown', () => {
        console.log("UIScene EVENTO: A cena foi DESLIGADA.");
    });


    const menuBackground = this.add.rectangle(
      655,
      0,
      this.scale.width,
      50,
      0x1a1a2e, // Uma cor que combine com o fundo do jogo
      0.8     
    ).setOrigin(0, 0);

    console.log("UIScene LOG: Retângulo de fundo criado.", {
        x: menuBackground.x,
        y: menuBackground.y,
        width: menuBackground.width,
        height: menuBackground.height,
        visible: menuBackground.visible,
        alpha: menuBackground.alpha,
        scrollFactor: menuBackground.scrollFactorX // Verificando o valor inicial
    });




    // Travando os elementos para ignorarem a câmera
    menuBackground.setScrollFactor(0);

    console.log("UIScene LOG: Fator de scroll definido como 0. UI está estática.");
    console.log(`UIScene LOG: Scroll factor do fundo agora é ${menuBackground.scrollFactorX}`);


    console.log("UIScene CREATE: Create() finalizado. A UI deve estar visível no ecrã.");
  }
}
