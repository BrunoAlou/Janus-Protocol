/**
 * OptionFilterService - Serviço genérico para gerenciar opções selecionadas
 * Pode ser reutilizado em qualquer mapa/NPC com sistema de diálogo condicional
 * 
 * Rastreia quais opções foram selecionadas em cada interação.
 * Permite filtrar opções já usadas.
 */
export class OptionFilterService {
  constructor(flagKey = 'selected_options') {
    this.flagKey = flagKey;
  }

  /**
   * Marca uma opção como selecionada
   * @param {string} optionId - ID da opção selecionada
   */
  markOptionSelected(optionId) {
    const currentSelected = window.gameState?.getFlag?.(this.flagKey) || '';
    const selectedOptions = currentSelected ? currentSelected.split(',').filter(Boolean) : [];
    
    if (!selectedOptions.includes(optionId)) {
      selectedOptions.push(optionId);
    }
    
    const newSelected = selectedOptions.join(',');
    window.gameState?.setFlag?.(this.flagKey, newSelected);
    
    console.log(`[OptionFilterService] Option marked: ${optionId}`);
    console.log(`[OptionFilterService] Current selected:`, newSelected);
    
    return newSelected;
  }

  /**
   * Obtém a lista de opções já selecionadas
   * @returns {string[]} Array de IDs de opções selecionadas
   */
  getSelectedOptions() {
    const selectedStr = window.gameState?.getFlag?.(this.flagKey) || '';
    return selectedStr ? selectedStr.split(',').filter(Boolean) : [];
  }

  /**
   * Filtra uma lista de opções, removendo as já selecionadas
   * @param {Array} options - Array de opções
   * @param {string} idField - Nome do campo que contém o ID ('id' por padrão)
   * @returns {Array} Opções disponíveis (não selecionadas)
   */
  filterAvailableOptions(options, idField = 'id') {
    const selected = this.getSelectedOptions();
    return options.filter(option => !selected.includes(option[idField]));
  }

  /**
   * Limpa o registro de opções selecionadas (reset)
   */
  clearSelectedOptions() {
    window.gameState?.setFlag?.(this.flagKey, '');
    console.log(`[OptionFilterService] Selected options cleared for flag: ${this.flagKey}`);
  }

  /**
   * Verifica se uma opção foi já selecionada
   * @param {string} optionId - ID da opção
   * @returns {boolean}
   */
  isOptionSelected(optionId) {
    return this.getSelectedOptions().includes(optionId);
  }

  /**
   * Retorna o número de opções selecionadas
   * @returns {number}
   */
  getSelectedCount() {
    return this.getSelectedOptions().length;
  }
}
