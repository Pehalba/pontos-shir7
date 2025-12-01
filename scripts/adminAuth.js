/**
 * Autenticação do Admin
 */

import { checkAdminPassword } from './admin.js';

/**
 * Mostra modal de autenticação
 */
export function showAdminAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal auth-modal--active';
    
    modal.innerHTML = `
        <div class="auth-modal__content">
            <h2 class="auth-modal__title">Acesso do Gestor</h2>
            <p class="auth-modal__text">Digite a senha para acessar o painel do gestor:</p>
            <input 
                type="password" 
                id="adminPasswordInput" 
                class="auth-modal__input" 
                placeholder="Senha"
                autofocus
            >
            <div class="auth-modal__actions">
                <button id="authCancelBtn" class="btn btn--secondary">Cancelar</button>
                <button id="authConfirmBtn" class="btn btn--primary">Entrar</button>
            </div>
            <div id="authErrorMessage" class="auth-modal__error"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#adminPasswordInput');
    const confirmBtn = modal.querySelector('#authConfirmBtn');
    const cancelBtn = modal.querySelector('#authCancelBtn');
    const errorDiv = modal.querySelector('#authErrorMessage');
    
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    const handleAuth = () => {
        const password = input.value;
        if (checkAdminPassword(password)) {
            window.location.href = 'admin.html';
        } else {
            errorDiv.textContent = 'Senha incorreta';
            errorDiv.style.display = 'block';
            input.value = '';
            input.focus();
        }
    };
    
    confirmBtn.addEventListener('click', handleAuth);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAuth();
        }
    });
    cancelBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    input.focus();
}




