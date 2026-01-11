/**
 * EXEMPLOS DE USO - Abstração de Transição de Mapas
 * 
 * Este arquivo demonstra como usar a nova API abstrata de transição de mapas
 * em diferentes cenários do jogo.
 */

// ============================================
// 1. TRANSIÇÃO SIMPLES ENTRE MAPAS
// ============================================

// Quando um NPC abre uma porta
function handleDoorInteraction(targetMapKey) {
  window.sceneManager.goToMap(targetMapKey);
}

// Exemplo: Clicar em uma porta para sair da sala
handleDoorInteraction('ReceptionScene');      // ✓ Volta à recepção
handleDoorInteraction('OfficeScene');         // ✓ Vai para o escritório
handleDoorInteraction('LabScene');            // ✓ Vai para o laboratório


// ============================================
// 2. TRANSIÇÃO COM DADOS CONTEXTUAIS
// ============================================

// Quando o player usa um elevador
function handleElevatorButton(destinationMap) {
  window.sceneManager.goToMap(destinationMap, {
    fromElevator: true,
    elevatorId: 'main-elevator',
    timestamp: Date.now()
  });
}

handleElevatorButton('OfficeScene');


// ============================================
// 3. TRANSIÇÃO PÓS-EVENTO (ex: Diálogo)
// ============================================

// Quando um diálogo termina e o player deve ir para outro local
function handleDialogCompletion(dialogResult) {
  const { nextLocation, questId } = dialogResult;
  
  if (window.sceneManager.isValidMap(nextLocation)) {
    window.sceneManager.goToMap(nextLocation, {
      questCompleted: questId,
      fromDialog: true,
      dialogId: 'scientist-dialog'
    });
  } else {
    console.warn(`Localização inválida: ${nextLocation}`);
  }
}

handleDialogCompletion({
  nextLocation: 'LabScene',
  questId: 'QUEST_001'
});


// ============================================
// 4. TRANSIÇÃO CONDICIONAL BASEADA EM ESTADO
// ============================================

// Sistema de acesso a áreas restritas
function goToRestrictedArea(targetMap, playerInventory) {
  // Verificar se o player tem permissão
  const hasRequiredItem = playerInventory.includes('security-card');
  
  if (!hasRequiredItem) {
    // Voltar sem conseguir entrar
    window.sceneManager.goToMap('ReceptionScene', {
      accessDenied: true,
      reason: 'sem-cartão-de-segurança'
    });
    return;
  }
  
  // Player tem permissão
  window.sceneManager.goToMap(targetMap, {
    accessGranted: true,
    securityLevel: 'restricted'
  });
}


// ============================================
// 5. NAVEGAÇÃO DINÂMICA
// ============================================

// Sistema de mapas em um objeto JSON
const gameMap = {
  'ReceptionScene': {
    north: 'HallwayScene',
    east: 'OfficeScene',
    west: 'ArchiveRoomScene'
  },
  'OfficeScene': {
    south: 'ReceptionScene',
    east: 'LabScene'
  },
  'LabScene': {
    west: 'OfficeScene',
    south: 'ReceptionScene'
  }
};

function moveInDirection(currentMap, direction) {
  const nextMap = gameMap[currentMap]?.[direction];
  
  if (nextMap && window.sceneManager.isValidMap(nextMap)) {
    window.sceneManager.goToMap(nextMap, {
      enteredFrom: direction,
      previousLocation: currentMap
    });
  } else {
    console.log('Não pode ir nessa direção');
  }
}

// Usar
moveInDirection('ReceptionScene', 'east');  // Vai para OfficeScene
moveInDirection('OfficeScene', 'east');     // Vai para LabScene


// ============================================
// 6. TRANSIÇÃO COM SPAWN POSITION
// ============================================

// Sistema de reentrada em uma cena com posição específica
function goToMapWithSpawnPoint(targetMap, spawnPointId) {
  const spawnPositions = {
    'OfficeScene': {
      'from-hallway': { x: 50, y: 200 },
      'from-elevator': { x: 300, y: 150 }
    },
    'LabScene': {
      'from-office': { x: 100, y: 100 },
      'from-hallway': { x: 400, y: 250 }
    }
  };
  
  const spawnPos = spawnPositions[targetMap]?.[spawnPointId];
  
  window.sceneManager.goToMap(targetMap, {
    spawnPosition: spawnPos || { x: 0, y: 0 },
    spawnPointId
  });
}

goToMapWithSpawnPoint('OfficeScene', 'from-hallway');


// ============================================
// 7. HISTÓRICO DE NAVEGAÇÃO
// ============================================

class NavigationHistory {
  constructor(sceneManager) {
    this.history = [];
    this.maxHistory = 10;
    this.sceneManager = sceneManager;
  }
  
  goToMap(targetMap, data = {}) {
    const currentMap = this.sceneManager.getCurrentMap();
    
    // Adicionar ao histórico
    if (currentMap) {
      this.history.push(currentMap);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }
    
    // Ir para o novo mapa
    this.sceneManager.goToMap(targetMap, data);
  }
  
  goBack() {
    if (this.history.length > 0) {
      const previousMap = this.history.pop();
      this.sceneManager.goToMap(previousMap, {
        fromHistory: true
      });
    }
  }
}

const navHistory = new NavigationHistory(window.sceneManager);
navHistory.goToMap('OfficeScene');
navHistory.goToMap('LabScene');
navHistory.goBack();  // Volta para OfficeScene


// ============================================
// 8. SISTEMA DE MISSÕES COM TRANSIÇÃO
// ============================================

class MissionSystem {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.currentMission = null;
  }
  
  startMission(missionId, targetMap) {
    this.currentMission = missionId;
    
    this.sceneManager.goToMap(targetMap, {
      missionId,
      missionStarted: true,
      objective: this.getMissionObjective(missionId)
    });
  }
  
  completeMission(rewardMap = 'ReceptionScene') {
    const missionId = this.currentMission;
    this.currentMission = null;
    
    this.sceneManager.goToMap(rewardMap, {
      completedMission: missionId,
      reward: this.getMissionReward(missionId)
    });
  }
  
  getMissionObjective(missionId) {
    const objectives = {
      'MISSION_001': 'Encontrar o documento',
      'MISSION_002': 'Resolver o quebra-cabeça'
    };
    return objectives[missionId] || 'Completar missão';
  }
  
  getMissionReward(missionId) {
    return { xp: 100, gold: 50 };
  }
}


// ============================================
// 9. TRANSIÇÃO COM ANIMATION/FADE
// ============================================

async function goToMapWithTransition(targetMap, data = {}) {
  const currentScene = window.sceneManager.getCurrentMap();
  
  // Aqui você poderia adicionar efeitos visuais
  // Ex: fade out, slide transition, etc.
  
  console.log(`🎬 Transitioning from ${currentScene} to ${targetMap}...`);
  
  // Simular transição
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Executar transição
  window.sceneManager.goToMap(targetMap, {
    ...data,
    transitionUsed: 'fade'
  });
  
  console.log(`✓ Transição concluída`);
}


// ============================================
// 10. VALIDAÇÃO E TRATAMENTO DE ERROS
// ============================================

function safeGoToMap(targetMap, data = {}) {
  // Validar mapa
  if (!window.sceneManager.isValidMap(targetMap)) {
    console.error(`❌ Mapa inválido: ${targetMap}`);
    console.log(`📍 Mapas disponíveis:`, window.sceneManager.getAvailableMaps());
    return false;
  }
  
  // Validar dados
  if (!data || typeof data !== 'object') {
    console.warn('⚠️  Dados inválidos, usando vazio');
    data = {};
  }
  
  // Transição segura
  try {
    window.sceneManager.goToMap(targetMap, data);
    console.log(`✓ Transição bem-sucedida para ${targetMap}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro na transição:`, error);
    return false;
  }
}


// ============================================
// PADRÃO DE USO EM COMPONENTES DE CENA
// ============================================

// Em BaseMapScene.js ou qualquer cena de mapa
class ExampleMapScene extends Phaser.Scene {
  
  handleNPCInteraction(npcId) {
    const npcData = this.getNPCData(npcId);
    
    // Mostrar diálogo
    this.showDialog(npcData.dialog, () => {
      // Quando diálogo termina, ir para próximo mapa
      if (npcData.nextScene) {
        window.sceneManager.goToMap(npcData.nextScene, {
          npcId,
          questStep: npcData.questStep
        });
      }
    });
  }
  
  handleDoorClick(doorData) {
    const { targetScene, locked, requiredItem } = doorData;
    
    // Verificar se porta está trancada
    if (locked && !this.inventory.has(requiredItem)) {
      this.showMessage('A porta está trancada!');
      return;
    }
    
    // Ir para próximo mapa
    window.sceneManager.goToMap(targetScene, {
      fromDoor: true,
      doorId: doorData.id
    });
  }
  
  getNPCData(npcId) {
    // Simular busca de dados
    return {
      dialog: 'Olá!',
      nextScene: 'LabScene',
      questStep: 1
    };
  }
  
  showDialog(text, onComplete) {
    // Implementar diálogo
  }
  
  showMessage(text) {
    // Implementar mensagem
  }
}
