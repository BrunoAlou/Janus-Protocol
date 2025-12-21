// Script de teste para o SceneManager
// Cole no console do navegador após o jogo carregar

console.log('=== TESTE DO SCENEMANAGER ===');

// 1. Verificar se SceneManager existe
if (window.sceneManager) {
  console.log('✓ SceneManager inicializado');
} else {
  console.error('✗ SceneManager não encontrado');
}

// 2. Verificar estado atual
console.log('\n--- Estado Atual ---');
const state = window.sceneManager.getState();
console.log('Auth:', state.auth);
console.log('Map:', state.map);
console.log('Minigame:', state.minigame);
console.log('System:', state.system);
console.log('Cenas Ativas:', state.activeScenes);

// 3. Verificar se cenas necessárias estão ativas
console.log('\n--- Verificação de Cenas ---');
const expectedScenes = state.auth ? ['LoginScene'] : [state.map, 'UIScene', 'DialogScene', 'PauseMenuScene', 'MinimapScene'].filter(Boolean);

expectedScenes.forEach(sceneKey => {
  const isActive = window.sceneManager.game.scene.isActive(sceneKey);
  const isPaused = window.sceneManager.game.scene.isPaused(sceneKey);
  
  if (isActive && !isPaused) {
    console.log(`✓ ${sceneKey} - Ativa`);
  } else if (isActive && isPaused) {
    console.warn(`⚠ ${sceneKey} - Ativa mas Pausada`);
  } else {
    console.error(`✗ ${sceneKey} - Inativa`);
  }
});

// 4. Listar todas as cenas ativas
console.log('\n--- Todas as Cenas Ativas ---');
window.sceneManager.game.scene.scenes.forEach(scene => {
  if (scene.scene.isActive()) {
    const status = scene.scene.isPaused() ? '(pausada)' : '(rodando)';
    console.log(`  ${scene.scene.key} ${status}`);
  }
});

console.log('\n=== FIM DO TESTE ===');
