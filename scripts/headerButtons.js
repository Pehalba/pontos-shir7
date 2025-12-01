/**
 * Configura botões do header
 */

import { showAdminAuthModal } from './adminAuth.js';
import { setCurrentCollaborator } from './dataStore.firebase.js';
import { clearCurrentUser } from './auth.js';

export function setupHeaderButtons() {
    const adminBtn = document.getElementById('adminAccessBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminAuthModal);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            setCurrentCollaborator(null);
            clearCurrentUser();
            window.location.href = 'login.html';
        });
    }
}




