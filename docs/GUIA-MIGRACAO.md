# Guia de Migração - De switchToMap() para goToMap()

## 📝 Instruções Rápidas

Se você tem código usando `switchToMap()`, simplesmente mude o nome da função para `goToMap()`. A API é 100% compatível.

---

## 🔄 Exemplos de Migração

### Antes (Obsoleto)
```javascript
window.sceneManager.switchToMap('OfficeScene');
window.sceneManager.switchToMap('LabScene', { questId: 'Q001' });
```

### Depois (Novo)
```javascript
window.sceneManager.goToMap('OfficeScene');
window.sceneManager.goToMap('LabScene', { questId: 'Q001' });
```

**Funciona? Sim, exatamente igual!** ✓

---

## 🎯 Por Que Mudar?

| Aspecto | switchToMap | goToMap |
|---------|------------|---------|
| Nomeação | Genérica | Mais clara e intuitiva |
| Documentação | Padrão antigo | Nova arquitetura documentada |
| Performance | Igual | Igual |
| Compatibilidade | ✓ | ✓ |
| Status | ⚠️ Deprecated | ✅ Recomendado |

---

## 🚀 Próximas Melhorias

Com a base abstrata pronta, você pode facilmente implementar:

### 1. **Transições com Efeitos Visuais**
```javascript
async function goToMapWithFade(targetMap, duration = 500) {
  await fadeOut(duration);
  window.sceneManager.goToMap(targetMap);
  await fadeIn(duration);
}
```

### 2. **Sistema de Checkpoints**
```javascript
window.sceneManager.goToMap('OfficeScene', {
  checkpoint: 'door-north',  // Spawn em posição específica
  preserveInventory: true
});
```

### 3. **Histórico de Navegação**
```javascript
class NavigationManager {
  goToMap(map, data) {
    this.history.push(this.currentMap);
    window.sceneManager.goToMap(map, data);
  }
  
  goBack() {
    const previous = this.history.pop();
    window.sceneManager.goToMap(previous);
  }
}
```

### 4. **Fila de Transições**
```javascript
const queue = new TransitionQueue(window.sceneManager);
queue.add('OfficeScene');
queue.add('LabScene');
queue.add('BossRoomScene');
queue.execute();  // Executa sequencialmente
```

---

## 📍 Mapas Disponíveis

Use diretamente com `goToMap()`:

```javascript
// Todos esses funcionam:
goToMap('ReceptionScene');       // Recepção
goToMap('OfficeScene');          // Escritório
goToMap('LabScene');             // Laboratório
goToMap('MeetingRoomScene');     // Sala de Reunião
goToMap('ArchiveRoomScene');     // Arquivo
goToMap('ItRoomScene');          // TI
goToMap('RhRoomScene');          // RH
goToMap('ElevatorScene');        // Elevador
goToMap('GardenScene');          // Jardim
goToMap('BossRoomScene');        // Sala do Chefe
```

---

## ✨ Melhor Prática

Use os métodos auxiliares para código mais robusto:

```javascript
// ❌ Menos seguro
window.sceneManager.goToMap('OfficeScene');

// ✅ Mais seguro
if (window.sceneManager.isValidMap('OfficeScene')) {
  window.sceneManager.goToMap('OfficeScene');
} else {
  console.warn('Mapa inválido');
}

// ✅ Listar mapas disponíveis
const maps = window.sceneManager.getAvailableMaps();
console.log('Mapas disponíveis:', maps);

// ✅ Obter mapa atual
const current = window.sceneManager.getCurrentMap();
console.log('Você está em:', current);
```

---

## 🔧 Checklist de Migração

Se você está migrando código existente:

- [ ] Renomear todas as chamadas de `switchToMap()` para `goToMap()`
- [ ] Testar cada transição no jogo
- [ ] Verificar que dados de contexto são passados corretamente
- [ ] Atualizar documentação de codigo próprio
- [ ] Remover qualquer lógica duplicada de transição

---

## ❓ FAQs

**P: Preciso atualizar todos os meus `switchToMap()` agora?**
R: Não é urgente - `switchToMap()` ainda funciona, mas você verá avisos. Atualize gradualmente.

**P: Há diferença de performance?**
R: Não, são exatamente iguais internamente.

**P: E se eu usar um nome de mapa inválido?**
R: O console mostrará um erro e listará os mapas disponíveis. Nenhuma transição ocorrerá.

**P: Como passo dados para a nova cena?**
R: Use o segundo parâmetro: `goToMap('OfficeScene', { dados: 'aqui' })`

**P: Os dados anteriores são preservados?**
R: Automaticamente! A cena anterior é passada em `previousScene` nos dados.

---

## 📚 Recursos

- [Documentação Completa](./map-transition-abstraction.md)
- [Exemplos de Uso](./exemplos-transicao-mapas.js)
- [Resumo das Melhorias](./RESUMO-MELHORIAS.md)

---

**Tudo pronto! Sua arquitetura está moderna, escalável e fácil de manter.** 🎉
