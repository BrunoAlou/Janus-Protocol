/**
 * MinigameManager - Gerencia desbloqueio, tentativas e estatísticas de minigames
 * 
 * Responsabilidades:
 * - Carregar configuração de minigames (editável pelo RH)
 * - Rastrear minigames desbloqueados
 * - Registrar tentativas (first, best, average, etc.)
 * - Comparar com média pública
 * - Gerar relatório para RH
 */

import minigamesConfig from '../data/config/minigames-config.json';
import { getApiUrl } from '../config/apiConfig.js';
import { generateHRReport, extractMetricsForReport, formatMetricValue } from './minigame/reporting.js';
import {
  saveMinigameStorage,
  readMinigameStorage,
  clearMinigameStorage,
  getUnlockFlagKey,
  isUnlockedByFlag,
  setUnlockFlag,
  getMockPublicAverages
} from './minigame/storage.js';

export default class MinigameManager {
  constructor() {
    /** @type {Object} Configuração carregada do JSON */
    this.config = minigamesConfig;
    
    /** @type {Map<string, MinigameProgress>} Progresso por minigame */
    this.progress = new Map();
    
    /** @type {Map<string, boolean>} Minigames desbloqueados */
    this.unlocked = new Map();
    
    /** @type {Object} Médias públicas (carregadas do servidor) */
    this.publicAverages = {};
    
    /** @type {Function[]} Listeners */
    this._listeners = [];
    
    this._initialize();
  }
  
  /**
   * Inicializa o manager
   */
  _initialize() {
    // Inicializar todos os minigames como bloqueados
    Object.keys(this.config.minigames).forEach(key => {
      this.unlocked.set(key, false);
      this.progress.set(key, this._createEmptyProgress(key));
    });
    
    // Carregar progresso salvo (localStorage)
    this._loadFromStorage();

    // Sincronizar unlocks com flags globais do game state
    this.syncWithGameState();
    
    // Carregar médias públicas do servidor
    this._loadPublicAverages();
    
    console.log('[MinigameManager] Initialized with', Object.keys(this.config.minigames).length, 'minigames');
  }
  
  /**
   * Cria estrutura vazia de progresso
   * @param {string} minigameId 
   * @returns {MinigameProgress}
   */
  _createEmptyProgress(minigameId) {
    return {
      minigameId,
      unlocked: false,
      unlockedAt: null,
      unlockedContext: null,
      firstAttempt: null,
      bestAttempt: null,
      attempts: [],
      totalAttempts: 0
    };
  }
  
  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  
  /**
   * Verifica se um minigame está habilitado pelo RH
   * @param {string} minigameId 
   * @returns {boolean}
   */
  isEnabled(minigameId) {
    const config = this.config.minigames[minigameId];
    return config?.enabled === true;
  }
  
  /**
   * Verifica se um minigame é obrigatório para progressão
   * @param {string} minigameId 
   * @returns {boolean}
   */
  isRequiredForProgression(minigameId) {
    const config = this.config.minigames[minigameId];
    return config?.requireForProgression === true;
  }
  
  /**
   * Retorna configuração de um minigame
   * @param {string} minigameId 
   * @returns {Object|null}
   */
  getConfig(minigameId) {
    return this.config.minigames[minigameId] || null;
  }
  
  /**
   * Retorna todos os minigames habilitados
   * @returns {string[]}
   */
  getEnabledMinigames() {
    return Object.entries(this.config.minigames)
      .filter(([_, config]) => config.enabled)
      .map(([id, _]) => id);
  }
  
  /**
   * Retorna minigames desbloqueados e habilitados
   * @returns {Array<{id: string, config: Object, progress: MinigameProgress}>}
   */
  getUnlockedMinigames() {
    const result = [];
    
    this.unlocked.forEach((isUnlocked, minigameId) => {
      if (isUnlocked && this.isEnabled(minigameId)) {
        result.push({
          id: minigameId,
          config: this.getConfig(minigameId),
          progress: this.progress.get(minigameId)
        });
      }
    });
    
    return result;
  }

  /**
   * Verifica se existe pelo menos um minigame desbloqueado
   * @returns {boolean}
   */
  hasAnyUnlocked() {
    return this.getUnlockedMinigames().length > 0;
  }
  
  // ============================================
  // DESBLOQUEIO
  // ============================================
  
  /**
   * Desbloqueia um minigame
   * @param {string} minigameId 
   * @param {Object} context - Contexto do desbloqueio
   * @returns {boolean} Se foi desbloqueado com sucesso
   */
  unlock(minigameId, context = {}) {
    if (!this.isEnabled(minigameId)) {
      console.warn('[MinigameManager] Cannot unlock disabled minigame:', minigameId);
      return false;
    }
    
    if (this.unlocked.get(minigameId)) {
      console.log('[MinigameManager] Minigame already unlocked:', minigameId);
      return true;
    }
    
    // Atualizar estado
    this.unlocked.set(minigameId, true);
    this._setUnlockFlag(minigameId, true);
    
    const progress = this.progress.get(minigameId);
    progress.unlocked = true;
    progress.unlockedAt = Date.now();
    progress.unlockedContext = context;
    
    // Persistir
    this._saveToStorage();
    
    // Notificar listeners
    this._emit('minigame-unlocked', {
      minigameId,
      config: this.getConfig(minigameId),
      context
    });
    
    console.log('[MinigameManager] Unlocked:', minigameId);
    
    return true;
  }
  
  /**
   * Verifica se um minigame está desbloqueado
   * @param {string} minigameId 
   * @returns {boolean}
   */
  isUnlocked(minigameId) {
    const unlockedByMemory = this.unlocked.get(minigameId) === true;
    const unlockedByFlag = this._isUnlockedByFlag(minigameId);
    return unlockedByMemory || unlockedByFlag;
  }

  /**
   * Sincroniza estado local de unlock com flags do GameStateManager
   * @returns {boolean} se houve mudanças
   */
  syncWithGameState() {
    if (!window.gameState?.getFlag || !window.gameState?.setFlag) {
      return false;
    }

    let changed = false;

    Object.keys(this.config.minigames).forEach((minigameId) => {
      const progress = this.progress.get(minigameId) || this._createEmptyProgress(minigameId);
      const unlockedByFlag = this._isUnlockedByFlag(minigameId);
      const unlockedByMemory = this.unlocked.get(minigameId) === true;

      // Migração de estado legado (storage local) para flags globais
      if (!unlockedByFlag && unlockedByMemory) {
        this._setUnlockFlag(minigameId, true);
      }

      const effectiveUnlock = this._isUnlockedByFlag(minigameId) === true;
      if (this.unlocked.get(minigameId) !== effectiveUnlock) {
        this.unlocked.set(minigameId, effectiveUnlock);
        changed = true;
      }

      if (progress.unlocked !== effectiveUnlock) {
        progress.unlocked = effectiveUnlock;
        if (effectiveUnlock && !progress.unlockedAt) {
          progress.unlockedAt = Date.now();
        }
        this.progress.set(minigameId, progress);
        changed = true;
      }
    });

    if (changed) {
      this._saveToStorage();
    }

    return changed;
  }
  
  // ============================================
  // REGISTRO DE TENTATIVAS
  // ============================================
  
  /**
   * Registra uma tentativa de minigame
   * @param {string} minigameId 
   * @param {Object} result - Resultado da tentativa
   * @returns {AttemptRecord}
   */
  recordAttempt(minigameId, result) {
    const progress = this.progress.get(minigameId);
    if (!progress) {
      console.error('[MinigameManager] Unknown minigame:', minigameId);
      return null;
    }
    
    const attempt = {
      attemptNumber: progress.totalAttempts + 1,
      timestamp: Date.now(),
      score: result.score || 0,
      completed: result.completed || false,
      duration: result.duration || 0,
      metrics: result.metrics || {},
      difficulty: result.difficulty || 'normal'
    };
    
    // Adicionar à lista de tentativas
    progress.attempts.push(attempt);
    progress.totalAttempts++;
    
    // Primeira tentativa (usada para assessment)
    if (!progress.firstAttempt) {
      progress.firstAttempt = { ...attempt };
      console.log('[MinigameManager] First attempt recorded for:', minigameId);
    }
    
    // Melhor tentativa
    if (!progress.bestAttempt || attempt.score > progress.bestAttempt.score) {
      progress.bestAttempt = { ...attempt };
      console.log('[MinigameManager] New best attempt for:', minigameId);
    }
    
    // Persistir
    this._saveToStorage();
    
    // Notificar
    this._emit('attempt-recorded', {
      minigameId,
      attempt,
      isFirst: attempt.attemptNumber === 1,
      isNewBest: progress.bestAttempt.attemptNumber === attempt.attemptNumber
    });
    
    return attempt;
  }
  
  // ============================================
  // ESTATÍSTICAS
  // ============================================
  
  /**
   * Retorna estatísticas de um minigame
   * @param {string} minigameId 
   * @returns {MinigameStats}
   */
  getStats(minigameId) {
    const progress = this.progress.get(minigameId);
    if (!progress) return null;
    
    const publicAvg = this.publicAverages[minigameId] || null;
    
    // Calcular média do jogador
    let playerAverage = 0;
    if (progress.attempts.length > 0) {
      const sum = progress.attempts.reduce((acc, a) => acc + a.score, 0);
      playerAverage = sum / progress.attempts.length;
    }
    
    // Calcular percentil (se temos dados públicos)
    let percentile = null;
    if (publicAvg && progress.bestAttempt) {
      percentile = this._calculatePercentile(progress.bestAttempt.score, publicAvg);
    }
    
    return {
      minigameId,
      firstAttempt: progress.firstAttempt,
      bestAttempt: progress.bestAttempt,
      numberAttempts: progress.totalAttempts,
      average: playerAverage,
      publicAverage: publicAvg?.averageScore || null,
      percentile,
      comparison: this._generateComparison(minigameId, progress, publicAvg)
    };
  }
  
  /**
   * Gera comparação positiva com outros jogadores
   * @private
   */
  _generateComparison(minigameId, progress, publicAvg) {
    if (!publicAvg || !progress.bestAttempt) {
      return null;
    }
    
    const config = this.config.reportConfig;
    const percentile = this._calculatePercentile(progress.bestAttempt.score, publicAvg);
    
    // Só mostrar se acima do threshold mínimo
    if (config.positiveFramingOnly && percentile < config.hideIfBelow) {
      return null;
    }
    
    // Determinar categoria
    let category = null;
    if (percentile >= config.thresholds.excellent.percentile) {
      category = config.thresholds.excellent;
    } else if (percentile >= config.thresholds.good.percentile) {
      category = config.thresholds.good;
    } else if (percentile >= config.thresholds.average.percentile) {
      category = config.thresholds.average;
    }
    
    if (!category) return null;
    
    return {
      percentile,
      label: category.label,
      color: category.color,
      message: `Sua performance supera ${percentile}% dos participantes`
    };
  }
  
  /**
   * Calcula percentil baseado na distribuição pública
   * @private
   */
  _calculatePercentile(score, publicAvg) {
    if (!publicAvg || !publicAvg.distribution) {
      // Estimativa simples se não temos distribuição
      const avg = publicAvg?.averageScore || 50;
      const std = publicAvg?.standardDeviation || 15;
      const z = (score - avg) / std;
      // Aproximação de CDF normal
      return Math.min(99, Math.max(1, Math.round(50 + 50 * Math.tanh(z * 0.8))));
    }
    
    // Se temos distribuição, calcular percentil real
    const { distribution } = publicAvg;
    let below = 0;
    for (const bucket of distribution) {
      if (bucket.maxScore < score) {
        below += bucket.count;
      } else if (bucket.minScore <= score) {
        // Interpolação linear dentro do bucket
        const ratio = (score - bucket.minScore) / (bucket.maxScore - bucket.minScore);
        below += bucket.count * ratio;
        break;
      }
    }
    
    return Math.round((below / publicAvg.totalPlayers) * 100);
  }
  
  // ============================================
  // RELATÓRIO PARA RH
  // ============================================
  
  /**
   * Gera relatório completo para RH
   * @returns {HRReport}
   */
  generateHRReport() {
    return generateHRReport({
      progressMap: this.progress,
      isEnabled: (id) => this.isEnabled(id),
      getConfig: (id) => this.getConfig(id),
      getStats: (id) => this.getStats(id)
    });
  }
  
  /**
   * Extrai métricas específicas para o relatório
   * @private
   */
  _extractMetricsForReport(minigameId, progress) {
    return extractMetricsForReport({
      minigameId,
      progress,
      getConfig: (id) => this.getConfig(id)
    });
  }
  
  /**
   * Formata valor de métrica para exibição
   * @private
   */
  _formatMetricValue(key, value) {
    return formatMetricValue(key, value);
  }
  
  // ============================================
  // PERSISTÊNCIA
  // ============================================
  
  /**
   * Salva progresso no localStorage
   * @private
   */
  _saveToStorage() {
    try {
      saveMinigameStorage(this.unlocked, this.progress);
    } catch (err) {
      console.error('[MinigameManager] Failed to save:', err);
    }
  }
  
  /**
   * Carrega progresso do localStorage
   * @private
   */
  _loadFromStorage() {
    try {
      const data = readMinigameStorage();
      if (!data) return;
      
      // Restaurar unlocked
      if (data.unlocked) {
        Object.entries(data.unlocked).forEach(([key, value]) => {
          this.unlocked.set(key, value);
        });
      }
      
      // Restaurar progress
      if (data.progress) {
        Object.entries(data.progress).forEach(([key, value]) => {
          this.progress.set(key, value);
        });
      }
      
      console.log('[MinigameManager] Loaded from storage');
    } catch (err) {
      console.error('[MinigameManager] Failed to load:', err);
    }
  }
  
  /**
   * Carrega médias públicas do servidor
   * @private
   */
  async _loadPublicAverages() {
    try {
      const response = await fetch(getApiUrl('/api/minigames/public-averages'));
      if (response.ok) {
        this.publicAverages = await response.json();
        console.log('[MinigameManager] Loaded public averages');
      }
    } catch (err) {
      console.warn('[MinigameManager] Could not load public averages:', err);
      // Usar valores mock para desenvolvimento
      this._setMockPublicAverages();
    }
  }
  
  /**
   * Define médias mock para desenvolvimento
   * @private
   */
  _setMockPublicAverages() {
    this.publicAverages = getMockPublicAverages();
  }
  
  /**
   * Limpa todo o progresso (para novo jogo)
   */
  reset() {
    this.unlocked.clear();
    this.progress.clear();
    
    Object.keys(this.config.minigames).forEach(key => {
      this.unlocked.set(key, false);
      this.progress.set(key, this._createEmptyProgress(key));
      this._setUnlockFlag(key, false);
    });
    
    clearMinigameStorage();
    
    this._emit('progress-reset');
    console.log('[MinigameManager] Progress reset');
  }

  /**
   * @private
   */
  _getUnlockFlagKey(minigameId) {
    return getUnlockFlagKey(minigameId);
  }

  /**
   * @private
   */
  _isUnlockedByFlag(minigameId) {
    return isUnlockedByFlag(minigameId);
  }

  /**
   * @private
   */
  _setUnlockFlag(minigameId, unlocked) {
    setUnlockFlag(minigameId, unlocked);
  }
  
  // ============================================
  // EVENTOS
  // ============================================
  
  /**
   * Adiciona listener
   * @param {string} event 
   * @param {Function} callback 
   */
  on(event, callback) {
    this._listeners.push({ event, callback });
  }
  
  /**
   * Remove listener
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    this._listeners = this._listeners.filter(
      l => !(l.event === event && l.callback === callback)
    );
  }
  
  /**
   * Emite evento
   * @private
   */
  _emit(event, data) {
    this._listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }
}

// Tipos JSDoc
/**
 * @typedef {Object} MinigameProgress
 * @property {string} minigameId
 * @property {boolean} unlocked
 * @property {number|null} unlockedAt
 * @property {Object|null} unlockedContext
 * @property {AttemptRecord|null} firstAttempt
 * @property {AttemptRecord|null} bestAttempt
 * @property {AttemptRecord[]} attempts
 * @property {number} totalAttempts
 */

/**
 * @typedef {Object} AttemptRecord
 * @property {number} attemptNumber
 * @property {number} timestamp
 * @property {number} score
 * @property {boolean} completed
 * @property {number} duration
 * @property {Object} metrics
 * @property {string} difficulty
 */

/**
 * @typedef {Object} MinigameStats
 * @property {string} minigameId
 * @property {AttemptRecord|null} firstAttempt
 * @property {AttemptRecord|null} bestAttempt
 * @property {number} numberAttempts
 * @property {number} average
 * @property {number|null} publicAverage
 * @property {number|null} percentile
 * @property {Object|null} comparison
 */
