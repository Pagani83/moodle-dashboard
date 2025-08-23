/**
 * Utilitário para limpar acompanhamentos locais que não estão no banco
 */

import { useMoodleStore } from '@/store/moodle-store';

let hasCleared = false;

export const clearLocalAcompanhamentos = () => {
  if (hasCleared) return;
  
  const { acompanhamentos, clearAllAcompanhamentos } = useMoodleStore.getState();
  
  if (acompanhamentos.length > 0) {
    console.log('🧹 Limpando', acompanhamentos.length, 'acompanhamentos locais obsoletos');
    clearAllAcompanhamentos();
    hasCleared = true;
  }
};