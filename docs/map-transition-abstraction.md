# Abstração de Transição de Mapas

## Visão Geral

A estrutura de transição de mapas foi refatorada para seguir o padrão abstrato, eliminando múltiplas funções específicas e centralizar toda a lógica em um único ponto.

## Benefícios da Nova Estrutura

✅ **Código DRY (Don't Repeat Yourself)**: Uma única função para todas as transições de mapa
✅ **Fácil Manutenção**: Lógica centralizada em `goToMap()`
✅ **Configuração Centralizada**: Todos os mapas definidos em `mapConfig`
✅ **Escalabilidade**: Adicionar novos mapas requer apenas atualizar `mapConfig`
✅ **Validação Automática**: Verificação de mapas válidos integrada

## Arquitetura

### 1. Configuração de Mapas (`mapConfig`)

```javascript
this.mapConfig = {
  'ReceptionScene': { sceneKey: 'ReceptionScene', mapKey: 'reception' },
  'OfficeScene': { sceneKey: 'OfficeScene', mapKey: 'office' },
  // ... outros mapas
}
```

Cada mapa possui:
- `sceneKey`: Identificador único da cena Phaser
- `mapKey`: Chave do arquivo do mapa Tiled (sem extensão)

### 2. Função Abstrata `goToMap(mapSceneKey, data)`

A função centraliza toda a lógica de transição:

```javascript
manager.goToMap('OfficeScene', { fromInteraction: true });
```

**O que acontece automaticamente:**
1. ✓ Valida se o mapa existe
2. ✓ Verifica se já está no mapa (evita transição desnecessária)
3. ✓ Para a cena de mapa anterior
4. ✓ Inicia o novo mapa com dados contextuais
5. ✓ Garante que cenas de sistema estão ativas
6. ✓ Emite evento de mudança de sala

## Como Usar

### Transição Simples

```javascript
// Em uma cena, ir para o escritório
window.sceneManager.goToMap('OfficeScene');
```

### Transição com Dados

```javascript
// Passar dados adicionais para a cena de destino
window.sceneManager.goToMap('LabScene', {
  fromInteraction: true,
  npcId: 'scientist-01'
});
```

### Em Interações de Mapa

```javascript
// Exemplo em BaseMapScene.js
const handleDoorClick = (sceneKey) => {
  window.sceneManager.goToMap(sceneKey, {
    user: this.user,
    fromDoor: true
  });
};
```

## Métodos Auxiliares

### `getMapConfig(mapSceneKey)`
Obtém a configuração de um mapa específico.

```javascript
const config = manager.getMapConfig('OfficeScene');
console.log(config.mapKey); // 'office'
```

### `getAvailableMaps()`
Lista todas as chaves de mapas disponíveis.

```javascript
const maps = manager.getAvailableMaps();
// ['ReceptionScene', 'OfficeScene', 'LabScene', ...]
```

### `isValidMap(mapSceneKey)`
Verifica se um mapa é válido antes de usar.

```javascript
if (manager.isValidMap('OfficeScene')) {
  manager.goToMap('OfficeScene');
}
```

### `getCurrentMap()`
Obtém o mapa atualmente ativo.

```javascript
const current = manager.getCurrentMap();
console.log(current); // 'ReceptionScene'
```

## Fluxo de Transição

```
goToMap('OfficeScene')
    ↓
[Validação] - Mapa existe?
    ↓ (sim)
[Verificação] - Já estamos lá?
    ↓ (não)
[Cleanup] - Para o mapa anterior
    ↓
[Transition] - Inicia novo mapa
    ↓
[Restore] - Ativa cenas de sistema
    ↓
[Notify] - Emite evento 'room-changed'
    ↓
Transição completa ✓
```

## Mapas Disponíveis

| Mapa | Chave Scene | Chave Mapa |
|------|-------------|-----------|
| Recepção | `ReceptionScene` | `reception` |
| Escritório | `OfficeScene` | `office` |
| Laboratório | `LabScene` | `lab` |
| Sala de Reunião | `MeetingRoomScene` | `meeting-room` |
| Arquivo | `ArchiveRoomScene` | `archive-room` |
| TI | `ItRoomScene` | `it-room` |
| RH | `RhRoomScene` | `rh-room` |
| Elevador | `ElevatorScene` | `elevator` |
| Jardim | `GardenScene` | `garden` |
| Sala do Chefe | `BossRoomScene` | `boss-room` |

## Migração da Antiga API

### Antes (Obsoleto)
```javascript
window.sceneManager.switchToMap('OfficeScene', data);
```

### Depois (Novo)
```javascript
window.sceneManager.goToMap('OfficeScene', data);
```

> **Nota**: `switchToMap()` ainda funciona por compatibilidade, mas exibe um aviso de deprecação.

## Exemplos de Padrões Comuns

### Transição após Diálogo
```javascript
onDialogComplete(() => {
  window.sceneManager.goToMap('LabScene', { 
    dialogId: 'intro-lab' 
  });
});
```

### Transição com Posição do Player
```javascript
window.sceneManager.goToMap('OfficeScene', {
  spawnPosition: { x: 100, y: 200 },
  fromElevator: true
});
```

### Transição Condicional
```javascript
const targetMap = hasKeycard ? 'LabScene' : 'ReceptionScene';
window.sceneManager.goToMap(targetMap);
```

### Validação Antes da Transição
```javascript
if (manager.isValidMap(targetScene)) {
  manager.goToMap(targetScene);
} else {
  console.error(`Mapa inválido: ${targetScene}`);
  // Mostrar erro ao jogador
}
```

## Adicionando Novos Mapas

Para adicionar um novo mapa ao jogo:

1. **Criar a cena**: `src/scenes/map/NovaScene.js`
2. **Adicionar em `mapConfig`**:
   ```javascript
   'NovaScene': { sceneKey: 'NovaScene', mapKey: 'nova' }
   ```
3. **Pronto!** A cena está automaticamente disponível via `goToMap('NovaScene')`

## Notas de Implementação

- Transições de mapa sempre preservam o estado de cenas de sistema (UI, dialogs, etc)
- Dados anteriores da cena anterior são passados automaticamente
- Eventos são emitidos para sincronização de componentes dependentes
- A validação ocorre antes de qualquer mudança de estado
