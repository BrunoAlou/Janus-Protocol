# Mapa da Recepção - Estrutura e Layers

## 📋 Visão Geral

O mapa **`reception.json`** representa a primeira cena do jogo: a recepção do escritório. Este documento detalha as camadas (layers), colisões e configurações do tilemap.

---

## 📐 Especificações Técnicas

### Dimensões do Mapa
- **Largura**: 40 tiles
- **Altura**: 30 tiles
- **Tamanho do tile**: 16×16 pixels
- **Dimensões totais**: 640×480 pixels
- **Formato**: Tiled Map Editor (JSON)

### Tilesets Utilizados
1. **office_tiles** → `Modern_Office_Shadowless_16x16.png`
2. **office_tiles_2** → `Room_Builder_Office_16x16.png`

---

## 🗂️ Estrutura de Layers

O mapa possui **8 camadas** organizadas hierarquicamente:

### 1. **debug_numbers** (Layer 7)
- **Propósito**: Numeração de tiles para debug
- **Depth**: 0
- **Alpha**: 0.3 (30% de opacidade)
- **Visibilidade**: Sim (mas semi-transparente)
- **Colisão**: Não

**Uso**:
```javascript
const debugNumbersLayer = this.map.createLayer('debug_numbers', [tileset1, tileset2], 0, 0);
debugNumbersLayer.setDepth(0).setAlpha(0.3);
```

---

### 2. **Chão** (Floor)
- **Propósito**: Piso/chão da recepção
- **Depth**: 1
- **Visibilidade**: Sim
- **Colisão**: Não

**Características**:
- Base visual sobre a qual o player caminha
- Renderizado atrás de todos os elementos exceto debug
- Padrão de tiles repetidos criando textura de piso

---

### 3. **paredes2** (Secondary Walls)
- **Propósito**: Paredes secundárias/detalhes estruturais
- **Depth**: 2
- **Visibilidade**: Sim
- **Colisão**: **Sim** ✅

**Configuração de Colisão**:
```javascript
paredes2Layer.setCollisionByExclusion([-1]);
this.physics.add.collider(this.player, paredes2Layer);
```

---

### 4. **Paredes** (Main Walls)
- **Propósito**: Paredes principais do ambiente
- **Depth**: 3
- **Visibilidade**: Sim
- **Colisão**: **Sim** ✅

**Função**:
- Delimita os limites do ambiente
- Bloqueia passagem do player
- Maior depth que `paredes2` para renderizar por cima

---

### 5. **Objetos** (Objects)
- **Propósito**: Móveis, decorações e objetos interativos
- **Depth**: 4
- **Visibilidade**: Sim
- **Colisão**: **Sim** ✅

**Exemplos de objetos**:
- Mesas de recepção
- Cadeiras
- Plantas decorativas
- Balcões

---

### 6. **Portas** (Doors)
- **Propósito**: Portas e entradas/saídas
- **Depth**: 5
- **Visibilidade**: Sim
- **Colisão**: **Sim** ✅ (temporariamente)

**Notas**:
- Atualmente com colisão ativa
- Futuramente pode ter lógica de interação (abrir/fechar)
- Transições entre cenas

**Configuração**:
```javascript
const portasLayer = this.map.createLayer('Portas', [tileset1, tileset2], 0, 0);
portasLayer.setDepth(5);
portasLayer.setCollisionByExclusion([-1]);
this.physics.add.collider(this.player, portasLayer);
```

---

### 7. **ObjetosSobrepostos** (Overlapping Objects)
- **Propósito**: Elementos que aparecem sobre o player
- **Depth**: 6 (maior profundidade)
- **Visibilidade**: Sim
- **Colisão**: Não

**Função**:
- Topo de móveis altos
- Sombras
- Elementos decorativos superiores
- Player passa "por baixo" visualmente

---

### 8. **Camada de Blocos 6** (não utilizada)
- **Status**: Existente no JSON mas não carregada no código
- **Propósito**: Reserva/futura expansão

---

## 🎨 Hierarquia de Renderização (Depth Order)

```
┌─────────────────────────────────────┐
│  6 - ObjetosSobrepostos (sobre tudo)│
├─────────────────────────────────────┤
│  5 - Portas                          │
├─────────────────────────────────────┤
│  4 - Objetos + Player (depth: 4)    │
├─────────────────────────────────────┤
│  3 - Paredes                         │
├─────────────────────────────────────┤
│  2 - paredes2                        │
├─────────────────────────────────────┤
│  1 - Chão                            │
├─────────────────────────────────────┤
│  0 - debug_numbers (30% alpha)      │
└─────────────────────────────────────┘
```

**Player Depth**: 4 (configurado em `PlayerFactory.js`)
- Renderiza junto com camada "Objetos"
- Passa por baixo de "Portas" e "ObjetosSobrepostos"
- Passa por cima de "Paredes", "Chão" e "debug_numbers"

---

## 🚧 Colisões Implementadas

### Layers com Colisão Ativa

| Layer | Colisão | Método |
|-------|---------|--------|
| debug_numbers | ❌ Não | - |
| Chão | ❌ Não | - |
| paredes2 | ✅ Sim | `setCollisionByExclusion([-1])` |
| Paredes | ✅ Sim | `setCollisionByExclusion([-1])` |
| Objetos | ✅ Sim | `setCollisionByExclusion([-1])` |
| Portas | ✅ Sim | `setCollisionByExclusion([-1])` |
| ObjetosSobrepostos | ❌ Não | - |

### Explicação: `setCollisionByExclusion([-1])`

```javascript
paredesLayer.setCollisionByExclusion([-1]);
```

- **`-1`**: Representa tiles vazios (sem tile)
- **`Exclusion`**: Todos os tiles **exceto** `-1` terão colisão
- **Resultado**: Apenas tiles preenchidos causam colisão

---

## 🎯 Spawn Point do Player

O player é posicionado usando:

```javascript
const spawnPoint = this.getPlayerSpawnPoint();
const playerX = spawnPoint ? spawnPoint.x : this.map.widthInPixels / 2;
const playerY = spawnPoint ? spawnPoint.y : this.map.heightInPixels / 2;
```

**Lógica**:
1. Busca um objeto "spawn" no mapa (se configurado no Tiled)
2. **Fallback**: Centro do mapa (320×240 pixels)

**Posição padrão**: `(320, 240)` pixels = `(20, 15)` tiles

---

## 📦 Carregamento no GameScene

### Código Completo

```javascript
// 1. PRELOAD - Carregar assets
preload() {
  this.load.image("office_tiles_image", "./src/assets/Modern_Office_Shadowless_16x16.png");
  this.load.image("office_tiles_2_image", "./src/assets/Room_Builder_Office_16x16.png");
  this.load.tilemapTiledJSON("reception", "./src/assets/reception.json");
}

// 2. CREATE - Montar o mapa
create() {
  // Criar tilemap
  this.map = this.make.tilemap({ key: 'reception' });
  const tileset1 = this.map.addTilesetImage('office_tiles', 'office_tiles_image');
  const tileset2 = this.map.addTilesetImage('office_tiles_2', 'office_tiles_2_image');

  // Criar layers
  const debugNumbersLayer = this.map.createLayer('debug_numbers', [tileset1, tileset2], 0, 0);
  const chaoLayer = this.map.createLayer('Chão', [tileset1, tileset2], 0, 0);
  const paredes2Layer = this.map.createLayer('paredes2', [tileset1, tileset2], 0, 0);
  const paredesLayer = this.map.createLayer('Paredes', [tileset1, tileset2], 0, 0);
  const objetosLayer = this.map.createLayer('Objetos', [tileset1, tileset2], 0, 0);
  const portasLayer = this.map.createLayer('Portas', [tileset1, tileset2], 0, 0);
  const objetosSobrepostosLayer = this.map.createLayer('ObjetosSobrepostos', [tileset1, tileset2], 0, 0);

  // Definir profundidade
  if (debugNumbersLayer) debugNumbersLayer.setDepth(0).setAlpha(0.3);
  chaoLayer.setDepth(1);
  paredes2Layer.setDepth(2);
  paredesLayer.setDepth(3);
  objetosLayer.setDepth(4);
  portasLayer.setDepth(5);
  objetosSobrepostosLayer.setDepth(6);

  // Configurar colisões
  paredesLayer.setCollisionByExclusion([-1]);
  paredes2Layer.setCollisionByExclusion([-1]);
  objetosLayer.setCollisionByExclusion([-1]);
  portasLayer.setCollisionByExclusion([-1]);

  // Criar colliders com player
  this.physics.add.collider(this.player, paredesLayer);
  this.physics.add.collider(this.player, paredes2Layer);
  this.physics.add.collider(this.player, objetosLayer);
  this.physics.add.collider(this.player, portasLayer);
}
```

---

## 🔄 Diferenças vs Estrutura Anterior (`nivel_1.json`)

| Aspecto | Anterior (nivel_1) | Atual (reception) |
|---------|-------------------|-------------------|
| Nome do arquivo | `nivel_1.json` | `reception.json` ✅ |
| Layer de debug | ❌ Não tinha | ✅ `debug_numbers` |
| Layer de portas | ❌ Não tinha | ✅ `Portas` |
| Número de layers | 5 usadas | 7 usadas |
| Colisão em portas | - | ✅ Ativa |
| Depth máxima | 5 | 6 |

---

## 🎮 Interação com o Player

### Movimento
- **Velocidade**: 200 pixels/segundo (configurado em `PlayerController`)
- **Física**: Arcade Physics com colisões rígidas
- **Limites**: Definidos pelas layers com colisão

### Câmera
```javascript
this.cameras.main.startFollow(this.player);
this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
```

- **Segue o player** suavemente
- **Bounds**: 640×480 pixels (tamanho do mapa)
- Não sai dos limites do mapa

---

## 🛠️ Edição no Tiled

### Como editar o mapa

1. Abra o Tiled Map Editor
2. Carregue `src/assets/reception.json`
3. Edite as layers:
   - **Chão**: Base visual
   - **paredes2/Paredes**: Estruturas sólidas
   - **Objetos**: Móveis e decorações
   - **Portas**: Acessos
   - **ObjetosSobrepostos**: Elementos superiores
4. Salve e recarregue o jogo

### Boas Práticas

✅ **Fazer**:
- Usar tiles apropriados para cada layer
- Manter colisões apenas em layers estruturais
- Testar spawn point do player
- Documentar tiles especiais

❌ **Evitar**:
- Colocar objetos sólidos em "ObjetosSobrepostos"
- Deixar buracos nas paredes (player pode escapar)
- Sobrepor colisões desnecessariamente

---

## 🐛 Debug e Troubleshooting

### Layer não aparece

**Problema**: Layer criada mas não visível

**Verificar**:
```javascript
// 1. Nome da layer está correto?
const layer = this.map.createLayer('NomeExato', [tileset1, tileset2], 0, 0);

// 2. Depth está configurado?
layer.setDepth(4);

// 3. Layer tem tiles preenchidos no JSON?
console.log(layer.layer.data);
```

### Colisão não funciona

**Problema**: Player passa através das paredes

**Verificar**:
```javascript
// 1. Colisão foi ativada?
paredesLayer.setCollisionByExclusion([-1]);

// 2. Collider foi criado?
this.physics.add.collider(this.player, paredesLayer);

// 3. Debug visual (mostra tiles de colisão em vermelho)
paredesLayer.renderDebug(this.add.graphics(), {
  tileColor: null,
  collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255),
  faceColor: new Phaser.Display.Color(40, 39, 37, 255)
});
```

### Player aparece atrás de objetos

**Problema**: Profundidade incorreta

**Solução**:
```javascript
// Player depth deve estar entre Objetos (4) e ObjetosSobrepostos (6)
sprite.setDepth(4); // Em PlayerFactory.js
```

---

## 📝 Checklist de Validação

Antes de commitar mudanças no mapa:

- [ ] Todas as 7 layers são criadas no `GameScene.js`
- [ ] Depths estão na ordem correta (0-6)
- [ ] Colisões estão ativas nas 4 layers corretas
- [ ] Colliders criados para cada layer com colisão
- [ ] Player spawn funciona corretamente
- [ ] Câmera segue o player sem bugs
- [ ] Debug layer está semi-transparente (alpha: 0.3)
- [ ] Sem erros no console do navegador
- [ ] Player não atravessa paredes
- [ ] ObjetosSobrepostos renderizam sobre o player

---

## 🔗 Arquivos Relacionados

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/assets/reception.json` | Dados do tilemap (layers, tiles, colisões) |
| `src/assets/Modern_Office_Shadowless_16x16.png` | Tileset 1 (office_tiles) |
| `src/assets/Room_Builder_Office_16x16.png` | Tileset 2 (office_tiles_2) |
| `src/scenes/GameScene.js` | Carrega e configura o mapa |
| `src/player/PlayerFactory.js` | Define depth do player (4) |
| `src/player/PlayerController.js` | Movimento e física do player |

---

**Data de Criação**: Novembro 2025  
**Versão do Mapa**: 1.0 (Reception)  
**Engine**: Phaser 3.x  
**Editor**: Tiled Map Editor
