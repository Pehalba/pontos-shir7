/**
 * Inicialização do Sistema - Migração de dados
 * 
 * Garante que existe um colaborador padrão e migra dados antigos
 */
 
import {
    getCollaborators,
    addCollaborator,
    getCurrentCollaborator,
    setCurrentCollaborator,
    getActivitiesByCollaborator,
    addActivity,
    getRedemptionsByCollaborator,
    addRedemption
} from './dataStore.js';

import {
    loadDailyPoints,
    loadCompletedTasks
} from './storage.js';

// Função temporária para carregar resgates antigos
function loadOldRedemptions() {
    const saved = localStorage.getItem('shir7_redemptions');
    return saved ? JSON.parse(saved) : [];
}

/**
 * Inicializa o sistema (cria colaborador padrão se necessário)
 * 
 * OBS: continua usando dataStore local por enquanto para migração
 */
export function initializeSystem() {
    const collaborators = getCollaborators();
    
    // Se não há colaboradores, cria um padrão
    if (collaborators.length === 0) {
        const defaultCollab = addCollaborator({ 
            name: 'Colaborador Teste', 
            active: true 
        });
        setCurrentCollaborator(defaultCollab.id);
        migrateOldData(defaultCollab.id);
    } else {
        // Se há colaboradores mas não há colaborador atual, define o primeiro ativo
        const current = getCurrentCollaborator();
        if (!current) {
            const activeCollab = collaborators.find(c => c.active) || collaborators[0];
            if (activeCollab) {
                setCurrentCollaborator(activeCollab.id);
            }
        }
    }
}

/**
 * Migra dados antigos para o novo formato
 */
function migrateOldData(collaboratorId) {
    // Migra pontos diários (checklist)
    const dailyPoints = loadDailyPoints();
    Object.keys(dailyPoints).forEach(date => {
        const dayData = dailyPoints[date];
        if (dayData.checklist === 1) {
            addActivity({
                collaboratorId: collaboratorId,
                type: 'checklist',
                points: 1,
                date: `${date}T12:00:00`,
                description: 'Checklist diário completo'
            });
        }
    });
    
    // Migra tarefas completadas
    const completedTasks = loadCompletedTasks();
    completedTasks.forEach(task => {
        let type = 'tarefa_facil';
        if (task.type === 'intermediate') type = 'tarefa_media';
        if (task.type === 'hard') type = 'tarefa_dificil';
        
        addActivity({
            collaboratorId: collaboratorId,
            type: type,
            points: task.points,
            date: `${task.date}T12:00:00`,
            description: `Tarefa ${task.type} concluída`
        });
    });
    
    // Migra resgates antigos
    const oldRedemptions = loadOldRedemptions();
    oldRedemptions.forEach(redemption => {
        addRedemption({
            collaboratorId: collaboratorId,
            product: redemption.product,
            shirtName: redemption.shirtName || null,
            personalization: redemption.personalization || false,
            name: redemption.name || null,
            size: redemption.size,
            pointsCost: redemption.pointsCost,
            status: redemption.status || 'solicitado',
            date: redemption.date || new Date().toISOString(),
            month: redemption.month || getCurrentMonth()
        });
    });
}

/**
 * Obtém o mês atual
 */
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

