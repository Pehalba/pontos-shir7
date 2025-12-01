/**
 * Verificação de autenticação
 */

import {
    getCurrentCollaborator
} from './dataStore.js';

/**
 * Verifica se há um colaborador logado
 */
export function isAuthenticated() {
    const current = getCurrentCollaborator();
    return current !== null && current.active === true;
}

/**
 * Redireciona para login se não estiver autenticado
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Obtém o colaborador atual
 */
export function getCurrentUser() {
    return getCurrentCollaborator();
}




