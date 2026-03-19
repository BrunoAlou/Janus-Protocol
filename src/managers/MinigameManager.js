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
    return this.unlocked.get(minigameId) === true;
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
    const report = {
      generatedAt: Date.now(),
      minigames: [],
      summary: {
        totalUnlocked: 0,
        totalAttempts: 0,
        averageEngagement: 0
      }
    };
    
    this.progress.forEach((progress, minigameId) => {
      if (!progress.unlocked || !this.isEnabled(minigameId)) return;
      
      const config = this.getConfig(minigameId);
      const stats = this.getStats(minigameId);
      
      report.minigames.push({
        id: minigameId,
        displayName: config.displayName,
        icon: config.icon,
        stats,
        metrics: this._extractMetricsForReport(minigameId, progress)
      });
      
      report.summary.totalUnlocked++;
      report.summary.totalAttempts += progress.totalAttempts;
    });
    
    if (report.summary.totalUnlocked > 0) {
      report.summary.averageEngagement = 
        report.summary.totalAttempts / report.summary.totalUnlocked;
    }
    
    return report;
  }
  
  /**
   * Extrai métricas específicas para o relatório
   * @private
   */
  _extractMetricsForReport(minigameId, progress) {
    if (!progress.firstAttempt) return null;
    
    const config = this.getConfig(minigameId);
    const metrics = progress.firstAttempt.metrics || {};
    const labels = config.metrics?.reportLabels || {};
    
    const result = [];
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (labels[key]) {
        result.push({
          key,
          label: labels[key],
          value,
          formatted: this._formatMetricValue(key, value)
        });
      }
    });
    
    return result;
  }
  
  /**
   * Formata valor de métrica para exibição
   * @private
   */
  _formatMetricValue(key, value) {
    if (key.includes('Time') || key.includes('duration')) {
      // Tempo em segundos
      return `${Math.round(value / 1000)}s`;
    }
    if (key.includes('accuracy') || key.includes('Rate')) {
      // Porcentagem
      return `${Math.round(value)}%`;
    }
    if (key === 'wpm') {
      return `${value} PPM`;
    }
    return String(value);
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
      const data = {
        unlocked: Object.fromEntries(this.unlocked),
        progress: Object.fromEntries(this.progress)
      };
      localStorage.setItem('janus_minigame_progress', JSON.stringify(data));
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
      const saved = localStorage.getItem('janus_minigame_progress');
      if (!saved) return;
      
      const data = JSON.parse(saved);
      
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
    this.publicAverages = {
      QuizGame: { averageScore: 65, standardDeviation: 18, totalPlayers: 500 },
      MemoryGame: { averageScore: 70, standardDeviation: 15, totalPlayers: 450 },
      PuzzleGame: { averageScore: 60, standardDeviation: 20, totalPlayers: 400 },
      TypingGame: { averageScore: 55, standardDeviation: 22, totalPlayers: 380 },
      SnakeGame: { averageScore: 50, standardDeviation: 25, totalPlayers: 200 },
      TetrisGame: { averageScore: 58, standardDeviation: 20, totalPlayers: 180 },
      WhackAMoleGame: { averageScore: 72, standardDeviation: 12, totalPlayers: 220 }
    };
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
    });
    
    localStorage.removeItem('janus_minigame_progress');
    
    this._emit('progress-reset');
    console.log('[MinigameManager] Progress reset');
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
