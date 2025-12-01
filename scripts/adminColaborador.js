/**
 * Página de Detalhes do Colaborador - Admin (Firebase)
 */

import {
    getCollaboratorById,
    getActivitiesByCollaborator,
    getRedemptionsByCollaborator,
    getAdjustmentsByCollaborator,
    addAdjustment,
    calculateCollaboratorBalance,
    calculateMonthPoints,
    countMonthlyRedemptions
} from './dataStore.firebase.js';

let currentCollaboratorId = null;

/**
 * Inicializa a página
 */
async function init() {
    // Obtém ID do colaborador da URL
    const urlParams = new URLSearchParams(window.location.search);
    currentCollaboratorId = urlParams.get('id');
    
    if (!currentCollaboratorId) {
        window.location.href = 'admin.html';
        return;
    }
    
    await loadCollaboratorData();
    setupEventListeners();
}

/**
 * Carrega dados do colaborador
 */
async function loadCollaboratorData() {
    const collaborator = await getCollaboratorById(currentCollaboratorId);
    
    if (!collaborator) {
        window.location.href = 'admin.html';
        return;
    }
    
    // Atualiza nome do colaborador
    document.getElementById('collaboratorName').textContent = collaborator.name;
    
    // Calcula estatísticas
    const [balance, monthPoints, monthlyRedemptions] = await Promise.all([
        calculateCollaboratorBalance(currentCollaboratorId),
        calculateMonthPoints(currentCollaboratorId),
        countMonthlyRedemptions(currentCollaboratorId)
    ]);
    
    // Atualiza resumo
    document.getElementById('currentBalance').textContent = balance;
    document.getElementById('monthPoints').textContent = monthPoints;
    document.getElementById('monthlyRedemptions').textContent = monthlyRedemptions;
    document.getElementById('remainingRedemptions').textContent = Math.max(0, 3 - monthlyRedemptions);
    
    // Renderiza histórico
    renderHistory();
}

/**
 * Renderiza o histórico do colaborador
 */
async function renderHistory() {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    
    const [activities, redemptions, adjustments] = await Promise.all([
        getActivitiesByCollaborator(currentCollaboratorId),
        getRedemptionsByCollaborator(currentCollaboratorId),
        getAdjustmentsByCollaborator(currentCollaboratorId)
    ]);
    
    // Combina todos os registros
    const allEntries = [
        ...activities.map(a => ({ ...a, entryType: 'activity' })),
        ...redemptions.map(r => ({ ...r, entryType: 'redemption' })),
        ...adjustments.map(a => ({ ...a, entryType: 'adjustment' }))
    ];
    
    // Ordena por data (mais recente primeiro)
    allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = '';
    
    if (allEntries.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum registro encontrado.</p>';
        return;
    }
    
    allEntries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        let typeLabel = '';
        let description = '';
        let points = 0;
        
        if (entry.entryType === 'activity') {
            const typeMap = {
                'checklist': 'Checklist Diário',
                'tarefa_facil': 'Tarefa Fácil',
                'tarefa_media': 'Tarefa Intermediária',
                'tarefa_dificil': 'Tarefa Difícil'
            };
            typeLabel = typeMap[entry.type] || entry.type;
            description = entry.description || entry.type;
            points = entry.points || 0;
        } else if (entry.entryType === 'redemption') {
            typeLabel = 'Resgate';
            description = `${entry.product}${entry.shirtName ? ` - ${entry.shirtName}` : ''} (Tamanho: ${entry.size})`;
            points = -(entry.pointsCost || 0);
        } else if (entry.entryType === 'adjustment') {
            const typeMap = {
                'bonus': 'Bônus',
                'desconto': 'Desconto',
                'correcao': 'Correção'
            };
            typeLabel = typeMap[entry.type] || 'Ajuste';
            description = entry.reason || 'Ajuste manual';
            points = entry.points || 0;
        }
        
        item.innerHTML = `
            <div class="history-item__info">
                <div class="history-item__date">${formattedDate}</div>
                <div class="history-item__type">${typeLabel}</div>
                <div class="history-item__description">${description}</div>
            </div>
            <div class="history-item__points ${points >= 0 ? 'history-item__points--positive' : 'history-item__points--negative'}">
                ${points >= 0 ? '+' : ''}${points}
            </div>
        `;
        
        container.appendChild(item);
    });
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('adjustmentForm');
    if (form) {
        form.addEventListener('submit', handleAdjustment);
    }
}

/**
 * Manipula o ajuste de pontos
 */
async function handleAdjustment(e) {
    e.preventDefault();
    
    const type = document.getElementById('adjustmentType').value;
    const pointsInput = document.getElementById('adjustmentPoints');
    const reason = document.getElementById('adjustmentReason').value.trim();
    
    let points = parseFloat(pointsInput.value);
    
    // Validações
    if (!type) {
        alert('Por favor, selecione o tipo de ajuste.');
        return;
    }
    
    if (!points || isNaN(points)) {
        alert('Por favor, informe a quantidade de pontos.');
        return;
    }
    
    if (!reason) {
        alert('Por favor, informe o motivo do ajuste.');
        return;
    }
    
    // Ajusta pontos baseado no tipo
    if (type === 'desconto') {
        points = Math.abs(points) * -1; // Garante que seja negativo
    } else if (type === 'bonus') {
        points = Math.abs(points); // Garante que seja positivo
    }
    
    // Cria o ajuste
    await addAdjustment({
        collaboratorId: currentCollaboratorId,
        type: type,
        points: points,
        reason: reason
    });
    
    // Limpa o formulário
    form.reset();
    
    // Recarrega dados
    await loadCollaboratorData();
    
    // Mensagem de sucesso
    alert('Ajuste aplicado com sucesso!');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });
} else {
    init();
}




