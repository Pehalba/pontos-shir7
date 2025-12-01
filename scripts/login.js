/**
 * Sistema de Login - SHIR7 (Firebase)
 */

import {
    getCollaborators,
    getCurrentCollaborator,
    setCurrentCollaborator
} from './dataStore.firebase.js';

import { showAdminAuthModal } from './adminAuth.js';

/**
 * Inicializa a página de login
 */
async function init() {
    await renderCollaboratorsList();
    setupEventListeners();
    
    // Se já está logado, redireciona
    const current = await getCurrentCollaborator();
    if (current && current.active) {
        window.location.href = 'index.html';
    }
}

/**
 * Renderiza a lista de colaboradores
 */
async function renderCollaboratorsList() {
    const container = document.getElementById('collaboratorsList');
    if (!container) return;
    
    container.innerHTML = '<p class="login__empty">Carregando colaboradores...</p>';
    
    try {
        const collaborators = await getCollaborators();
        container.innerHTML = '';
        
        if (!collaborators || collaborators.length === 0) {
            container.innerHTML = '<p class="login__empty">Nenhum colaborador cadastrado. Acesse como gestor para criar colaboradores.</p>';
            return;
        }
        
        const activeCollaborators = collaborators.filter(c => c.active);
        
        if (activeCollaborators.length === 0) {
            container.innerHTML = '<p class="login__empty">Nenhum colaborador ativo no momento.</p>';
            return;
        }
        
        activeCollaborators.forEach(collab => {
            const item = document.createElement('div');
            item.className = 'login__item';
            item.dataset.collaboratorId = collab.id;
            
            item.innerHTML = `
                <div class="login__item-name">${collab.name}</div>
                <div class="login__item-status login__item-status--active">Ativo</div>
            `;
            
            item.addEventListener('click', () => {
                loginAsCollaborator(collab);
            });
            
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Erro ao carregar colaboradores do Firebase:', error);
        container.innerHTML = '<p class="login__empty">Erro ao carregar colaboradores. Tente novamente mais tarde.</p>';
    }
}

/**
 * Faz login como colaborador
 */
function loginAsCollaborator(collaborator) {
    setCurrentCollaborator(collaborator.id);
    // Salva dados básicos do colaborador para autenticação e header
    localStorage.setItem('shir7_current_user', JSON.stringify(collaborator));
    window.location.href = 'index.html';
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    const adminBtn = document.getElementById('adminAccessBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            showAdminAuthModal();
        });
    }
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
} else {
    init();
}
