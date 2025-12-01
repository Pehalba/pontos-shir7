/**
 * Verificação de autenticação (usa dados salvos no localStorage)
 */

const CURRENT_USER_KEY = 'shir7_current_user';

function readCurrentUser() {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Verifica se há um colaborador logado
 */
export function isAuthenticated() {
    const current = readCurrentUser();
    if (!current) return false;
    // Se o campo active não existir, considera como ativo (compatibilidade)
    if (typeof current.active === 'undefined') return true;
    return current.active === true;
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
    return readCurrentUser();
}

export function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_KEY);
}

