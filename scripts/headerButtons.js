/**
 * Configura botões do header
 */

import { showAdminAuthModal } from './adminAuth.js';
import { setCurrentCollaborator } from './dataStore.js';

export function setupHeaderButtons() {
    const adminBtn = document.getElementById('adminAccessBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminAuthModal);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            setCurrentCollaborator(null);
            window.location.href = 'login.html';
        });
    }
}




