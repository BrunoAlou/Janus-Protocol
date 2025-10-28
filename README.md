# Janus-Protocol

[Veja o GDD do projeto](./gdd.md)


Janus-Protocol é um projeto de TCC que explora o campo de Avaliação Baseada em Jogos (Game-Based Assessment). Trata-se de um jogo 2D de pixel art, com visão top-down, onde o jogador deve escapar de um escritório durante uma crise de sistema causada por uma Inteligência Artificial chamada JANUS.

Diferente de testes tradicionais, o protocolo não faz perguntas. Em vez disso, ele analisa as ações, decisões e estratégias do jogador durante a simulação de alta pressão. Cada escolha é mapeada para o modelo Gamer Performance Index (GPI), que avalia quatro eixos comportamentais fundamentais: Execução, Colaboração, Resiliência e Inovação.

O objetivo é gerar um perfil autêntico do candidato, baseado no que ele de fato faz, e não no que ele diz que faria.


## Resultados e discussões

Esta seção apresenta evidências do funcionamento do protótipo, com figuras da interface, tabelas-resumo e trechos de código que materializam as decisões de projeto. As imagens mencionadas podem ser adicionadas em `docs/img/` (nomes sugeridos abaixo).

### Interface e funcionamento (figuras)

- Figura 1 – Interface do jogo (slime controlável): visão top‑down do mapa de escritório, câmera seguindo o personagem slime. Arquivo sugerido: `docs/img/fig1-interface.png`.
- Figura 2 – Telemetria sendo emitida: captura do console/rede com eventos `slime_spawn` e `slime_animation` enviados ao backend. Arquivo sugerido: `docs/img/fig2-telemetry.png`.
- Figura 3 – Análise do spritesheet: saída do script `scripts/analyze-spritesheet.js` para o arquivo `personagem.png`, destacando a escolha de frames 32×64 (uma coluna por personagem). Arquivo sugerido: `docs/img/fig3-analyze-spritesheet.png`.

> Como gerar as figuras (sugestão):
> - Abrir o jogo (Vite dev server) e capturar tela com o slime em cena (Fig. 1).
> - Abrir DevTools > Network/Console durante o jogo, acionar movimento do slime e capturar os eventos (Fig. 2).
> - Executar a análise do spritesheet no terminal e capturar a saída (Fig. 3).

### Tabela A – Componentes do protótipo

| Componente | Tecnologia | Observação |
|---|---|---|
| Motor do jogo | Phaser 3.x | Renderização 2D, Arcade Physics, cenas e animações |
| Frontend | JavaScript (ES modules), HTML5, CSS | Servido via Vite durante o desenvolvimento |
| Mapa | Tiled (tilemap JSON) | Estilo pixel‑art com tiles 16×16 |
| Backend | Node.js + Express (server.js) | Recepção/armazenamento de eventos |
| Banco de dados | MongoDB | Armazena logs de telemetria para análise |

### Tabela B – Eventos de telemetria (amostra)

| event_type | Onde dispara | Payload (exemplo) | Finalidade |
|---|---|---|---|
| slime_spawn | `src/characters/SlimeFactory.js` | `{ frames: 8, keyBase: "slime" }` | Marcar presença e contexto do agente |
| slime_animation | `src/characters/SlimeFactory.js` | `{ state: 'walk' | 'idle' }` | Estado animado (input/no‑input) |
| position_sample | `telemetry.logAction` encadeado | `{ x, y }` | Amostrar posição relacionada ao evento principal |

### Tabela C – Exemplo de mapeamento para GPI (proposto)

| event_type | Regra/heurística | Faceta GPI |
|---|---|---|
| slime_animation = 'walk' com percurso sem colisões por Δt | Persistência + navegação eficiente | Execução |
| Interação com objetivos opcionais (futuro) | Prioriza colaboração sobre objetivos individuais | Colaboração |
| Tentativas repetidas após falha (futuro) | Mantém engajamento sob insucesso | Resiliência |
| Acesso a rotas alternativas/experimentação (futuro) | Busca estratégias novas | Inovação |

### Trechos de código relevantes

1) Controle baseado em teclas e animação condicional (walk/idle)

Arquivo: `src/characters/SlimeController.js`

```js
// SlimeController: movimenta slime via teclas e alterna animações walk/idle
export default class SlimeController {
	constructor(scene, slime, options = {}) {
		this.scene = scene;
		this.slime = slime;
		this.speed = options.speed ?? 160;
		this.cursors = scene.input.keyboard.createCursorKeys();
		this.wasd = scene.input.keyboard.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D' });
		this._moving = false;
	}
	update() {
		if (!this.slime?.body) return;
		let dx = 0, dy = 0;
		if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
		if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
		if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
		if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;
		if (dx || dy) {
			const len = Math.hypot(dx, dy) || 1; dx/=len; dy/=len;
			this.slime.body.setVelocity(Math.round(dx*this.speed), Math.round(dy*this.speed));
			if (dx<0) this.slime.setFlipX(true); else if (dx>0) this.slime.setFlipX(false);
			if (!this._moving) { this._moving = true; this.slime.startWalk?.(); }
		} else {
			this.slime.body.setVelocity(0, 0);
			if (this._moving) { this._moving = false; this.slime.startIdle?.(); }
		}
	}
}
```

2) Criação do slime e telemetria

Arquivo: `src/characters/SlimeFactory.js`

```js
import { logAction } from '../utils/telemetry.js';
// ... cria texturas canvas, animações slime_idle/slime_walk ...
export function createSlime(scene, x, y) {
	// ... sprite, escala e hitbox ...
	sprite.play('slime_idle'); // muda para walk ao pressionar teclas
	try { logAction('slime_spawn', { frames: 8, keyBase: 'slime' }, { x, y }); } catch {}
	sprite.startWalk = () => { sprite.play('slime_walk'); logAction('slime_animation', { state: 'walk' }, { x: sprite.x, y: sprite.y }); };
	sprite.startIdle = () => { sprite.play('slime_idle'); logAction('slime_animation', { state: 'idle' }, { x: sprite.x, y: sprite.y }); };
	return sprite;
}
```

3) Cena principal focada no slime

Arquivo: `src/scenes/GameScene.js`

```js
import { createSlime } from '../characters/SlimeFactory.js';
import SlimeController from '../characters/SlimeController.js';
// ... carrega tilemap e tilesets ...
this.slime = createSlime(this, playerX, playerY);
this.physics.add.collider(this.slime, paredesLayer);
this.cameras.main.startFollow(this.slime); this.cameras.main.setZoom(2);
this.slimeController = new SlimeController(this, this.slime, { speed: 160 });
// ...
update() { this.slimeController?.update(); }
```

4) Correção de recorte de spritesheet (personagem)

Arquivo: `src/assets/loadPlayerAssets.js`

```js
export const FRAME_WIDTH = 32; // uma coluna por personagem
export const FRAME_HEIGHT = 64; // personagem alto
scene.load.spritesheet('personagem', './src/assets/personagem.png', { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT });
```

5) Analisador de spritesheet (apoio metodológico)

Arquivo: `scripts/analyze-spritesheet.js`

```bash
# (Opcional) Exemplo de uso
node scripts/analyze-spritesheet.js personagem --row=3
```

Saída esperada: lista de combinações de (frameWidth × frameHeight) e o intervalo de frames da linha 3, orientando o recorte correto.

### Discussão

- A troca do recorte para 32×64 em `personagem.png` eliminou artefatos de “duas colunas por frame”, garantindo um único personagem por quadro e permitindo animar apenas a linha desejada.
- A separação de responsabilidades (Factory/Controller/Scene) simplifica testes e facilita a instrumentação de telemetria.
- A telemetria é assíncrona, em lote e resistente a falhas de rede (fila em memória e `localStorage`), o que é adequado ao contexto de coleta contínua durante gameplay.
- O mapeamento preliminar para GPI foi descrito como heurística e pode ser refinado com dados empíricos (normatização) em trabalhos futuros.

### Ameaças à validade e próximos passos

- Validade externa: os resultados são de um protótipo com uma única cena e agente; ampliar variedade de tarefas e dilemas comportamentais.
- Confiabilidade: repetir sessões com o mesmo participante para aferir estabilidade dos escores comportamentais.
- Backend: incluir agregações no servidor para sumarizar eventos e oferecer dashboards.

